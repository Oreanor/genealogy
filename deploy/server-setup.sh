#!/usr/bin/env bash
set -euo pipefail

owner=${SUDO_USER:?run through sudo from the deployment account}
home=$(getent passwd "$owner" | cut -d: -f6)
group=$(id -gn "$owner")
staging="$home/.local/share/genealogy"
root=/srv/genealogy
unit=/etc/systemd/system/genealogy.service
caddyfile=/etc/caddy/Caddyfile
marker='# genealogy'

node=$(find "$home/.nvm/versions/node" -maxdepth 3 -type f -path '*/bin/node' | sort -V | tail -n 1)
test -x "$node"
install -d -o "$owner" -g "$group" -m 755 "$root" "$root/releases"

if [[ ! -f "$root/current/server.js" ]]; then
  release=$(runuser -u "$owner" -- readlink "$staging/current")
  [[ "$release" =~ ^releases/[[:alnum:]-]+$ ]]
  runuser -u "$owner" -- cp -aT "$staging/$release" "$root/$release"
  runuser -u "$owner" -- ln -sfn "$release" "$root/current"
fi

if ! grep -qF "$marker" "$caddyfile"; then
  candidate=$(mktemp /etc/caddy/Caddyfile.genealogy.XXXXXX)
  trap 'rm -f -- "$candidate"' EXIT
  block=$(cat <<'EOF'
	# genealogy
	@genealogy path /genealogy /genealogy/*
	handle @genealogy {
		encode zstd gzip
		reverse_proxy 127.0.0.1:3122
	}
EOF
)
  awk -v block="$block" '
    !done && /^\thandle \{/ { print block; done = 1 }
    { print }
    END { if (!done) exit 1 }
  ' "$caddyfile" > "$candidate"
  caddy validate --adapter caddyfile --config "$candidate"
fi

cat > "$unit.new" <<EOF
[Unit]
Description=Genealogy

[Service]
User=$owner
WorkingDirectory=$root/current
Environment=NODE_ENV=production
Environment=HOSTNAME=127.0.0.1
Environment=PORT=3122
ExecStart=$node $root/current/server.js
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF
mv -T "$unit.new" "$unit"
systemctl daemon-reload
systemctl enable --now genealogy.service

if [[ -n "${candidate:-}" ]]; then
  cp -p "$caddyfile" "$caddyfile.bak-genealogy-$(date +%Y%m%d%H%M%S)"
  chmod 644 "$candidate"
  mv -T "$candidate" "$caddyfile"
fi
systemctl reload caddy

curl --retry 8 --retry-connrefused --retry-delay 1 --max-time 3 -fsS -o /dev/null http://127.0.0.1/genealogy/en
echo 'Genealogy is available at /genealogy'
