import fs from 'fs';
import path from 'path';

const src = path.resolve('docs/sumtsov-mykola-slobozhane (1).txt');
const outDir = path.resolve('docs/sumtsov-slobozhane-chapters');
const text = fs.readFileSync(src, 'utf8');
const lines = text.split(/\r?\n/);

/** [filename, startLine1, endLine1 inclusive, description] */
const chapters = [
  ['00-titul.txt', 1, 35, 'Титул, видавництво'],
  ['01-peredmova.txt', 36, 187, 'Передмова'],
  ['02-I-pochatok-slobozhanshchyny.txt', 188, 548, 'I. Початок Слобожанщини'],
  ['03-II-vidozvy.txt', 549, 1042, 'II. Відозви про слобожан'],
  ['04-III-podil-hromadyanstva.txt', 1043, 2098, 'III. Поділ громадянства'],
  ['05-IV-khliborobstvo.txt', 2099, 3228, 'IV. Хліборобство й промисловість'],
  ['06-V-torhivlia.txt', 3229, 3549, 'V. Торговля. Ярмарки'],
  ['07-VI-vid-kolysky.txt', 3550, 4097, 'VI. Від колиски до могили'],
  ['08-VII-budni-sviata.txt', 4098, 4692, 'VII. Будні й свята'],
  ['09-VIII-oselia.txt', 4693, 5197, 'VIII. Оселя'],
  ['10-IX-odezha.txt', 5198, 5419, 'IX. Одежа'],
  ['11-X-izha-napoi.txt', 5420, 5703, 'X. Їжа й напої'],
  ['12-XI-hromadske-khvyliuvannia.txt', 5704, 5975, 'XI. Громадське хвилювання'],
  ['13-XII-svitohliad.txt', 5976, 6465, 'XII. Світогляд. Забобони'],
  ['14-XIII-piiatstvo.txt', 6466, 6775, 'XIII. Піяцтво'],
  ['15-XIV-likhi-hodyny.txt', 6776, 7268, 'XIV. Лихі години. Хвороби. Ліки'],
  ['16-XV-nauka-mystetstvo.txt', 7269, 7957, 'XV. Наука й мистецтво'],
  ['17-XVI-presa-teatr.txt', 7958, 8216, 'XVI. Преса. Театр'],
  ['18-XVII-diiachi-folkloru.txt', 8217, 8917, 'XVII. Діячі слободського фольклору'],
  ['19-XVIII-etnohrafichnyi-muzei.txt', 8918, 8985, 'XVIII. Етнографічний музей в Харькові'],
  ['20-XIX-tserkovni-muzei.txt', 8986, 9153, 'XIX. Церковні музеї'],
  ['21-XX-korotki-dodatky.txt', 9154, 9650, 'XX. Короткі додатки'],
  ['22-pokazchyk-ta-zmist.txt', 9651, lines.length, 'Показчик імен і речей, зміст (кінець книги)'],
];

fs.mkdirSync(outDir, { recursive: true });

for (const [file, start, end, title] of chapters) {
  const slice = lines.slice(start - 1, end);
  const header = `${title}\n${'—'.repeat(Math.min(60, title.length))}\nДжерело: sumtsov-mykola-slobozhane (1).txt, рядки ${start}–${end}\n\n`;
  fs.writeFileSync(path.join(outDir, file), header + slice.join('\n') + '\n', 'utf8');
}

console.log('Wrote', chapters.length, 'files to', outDir);
