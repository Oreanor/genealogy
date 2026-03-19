import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import type { Person } from '@/lib/types/person';
import { getPersons } from '@/lib/data/persons';
import { getRootPersonId } from '@/lib/data/root';
import { buildTreeMatrix } from '@/lib/utils/tree';
import { formatLifeDates, getFullName } from '@/lib/utils/person';
import { getChildren, getSpouse, getSiblings } from '@/lib/data/familyRelations';
import { getPersonById } from '@/lib/data/persons';
import { getAvatarForPerson } from '@/lib/data/photos';
import { getHistoryEntriesByPerson } from '@/lib/data/history';
import { s, COLORS } from './styles';

export interface PersonsLabels {
  chapterPersons: string;
  spouseM: string;
  spouseF: string;
  parents: string;
  children: string;
  siblings: string;
  years: string;
  birthPlace: string;
  residenceCity: string;
  occupation: string;
  comment: string;
  mentionedIn: string;
  photo: string;
}

/** Order persons: root first, then by generation (parents, grandparents, etc.), then remaining. */
function getOrderedPersons(): Person[] {
  const rootId = getRootPersonId();
  const matrix = buildTreeMatrix(rootId);
  const ordered: Person[] = [];
  const seen = new Set<string>();

  for (const row of matrix) {
    for (const person of row) {
      if (person && !seen.has(person.id)) {
        ordered.push(person);
        seen.add(person.id);
      }
    }
  }

  for (const person of getPersons()) {
    if (!seen.has(person.id)) {
      ordered.push(person);
      seen.add(person.id);
    }
  }

  return ordered;
}

function PersonInfoPage({ person, labels }: { person: Person; labels: PersonsLabels }) {
  const children = getChildren(person.id);
  const siblings = getSiblings(person.id);
  const spouse = getSpouse(person.id);
  const parents = [person.fatherId, person.motherId]
    .filter(Boolean)
    .map((id) => getPersonById(id as string))
    .filter((p): p is Person => p != null);
  const historyMentions = getHistoryEntriesByPerson(person.id);

  return (
    <Page size="A5" style={s.pageA5}>
      <Text style={s.sectionTitle}>{getFullName(person)}</Text>

      {(person.birthDate || person.deathDate) && (
        <View style={{ flexDirection: 'row', marginBottom: 3 }}>
          <Text style={s.label}>{labels.years} </Text>
          <Text style={s.bodyText}>{formatLifeDates(person.birthDate, person.deathDate)}</Text>
        </View>
      )}

      {person.birthPlace && (
        <View style={{ flexDirection: 'row', marginBottom: 3 }}>
          <Text style={s.label}>{labels.birthPlace} </Text>
          <Text style={s.bodyText}>{person.birthPlace}</Text>
        </View>
      )}

      {person.occupation && (
        <View style={{ flexDirection: 'row', marginBottom: 3 }}>
          <Text style={s.label}>{labels.occupation} </Text>
          <Text style={s.bodyText}>{person.occupation}</Text>
        </View>
      )}

      {person.residenceCity && (
        <View style={{ flexDirection: 'row', marginBottom: 3 }}>
          <Text style={s.label}>{labels.residenceCity} </Text>
          <Text style={s.bodyText}>{person.residenceCity}</Text>
        </View>
      )}

      {person.comment && (
        <View style={{ flexDirection: 'row', marginBottom: 3 }}>
          <Text style={s.label}>{labels.comment} </Text>
          <Text style={s.bodyText}>{person.comment}</Text>
        </View>
      )}

      {spouse && (
        <View style={{ flexDirection: 'row', marginBottom: 3 }}>
          <Text style={s.label}>{spouse.gender === 'f' ? labels.spouseF : labels.spouseM} </Text>
          <Text style={s.bodyText}>{getFullName(spouse)}</Text>
        </View>
      )}

      {parents.length > 0 && (
        <View style={{ flexDirection: 'row', marginBottom: 3, flexWrap: 'wrap' }}>
          <Text style={s.label}>{labels.parents} </Text>
          <Text style={s.bodyText}>{parents.map((p) => getFullName(p)).join(', ')}</Text>
        </View>
      )}

      {children.length > 0 && (
        <View style={{ flexDirection: 'row', marginBottom: 3, flexWrap: 'wrap' }}>
          <Text style={s.label}>{labels.children} </Text>
          <Text style={s.bodyText}>{children.map((c) => getFullName(c)).join(', ')}</Text>
        </View>
      )}

      {siblings.length > 0 && (
        <View style={{ flexDirection: 'row', marginBottom: 3, flexWrap: 'wrap' }}>
          <Text style={s.label}>{labels.siblings} </Text>
          <Text style={s.bodyText}>{siblings.map((s) => getFullName(s)).join(', ')}</Text>
        </View>
      )}

      {historyMentions.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Text style={[s.label, { marginBottom: 3 }]}>{labels.mentionedIn}</Text>
          {historyMentions.map(({ entry, index }) => (
            <Text key={index} style={{ fontSize: 9, marginBottom: 2, color: COLORS.accent }}>
              • {entry.title || `#${index + 1}`}
            </Text>
          ))}
        </View>
      )}

      <Text style={s.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
    </Page>
  );
}

function PersonPhotoPage({ person }: { person: Person }) {
  const avatar = getAvatarForPerson(person.id, person.avatarPhotoSrc);
  if (!avatar) return null;

  return (
    <Page size="A5" style={[s.pageA5, { justifyContent: 'center', alignItems: 'center' }]}>
      <Image
        src={avatar.src}
        style={{ maxWidth: '100%', maxHeight: '85%', objectFit: 'contain' }}
      />
      <Text style={[s.caption, { marginTop: 8 }]}>{getFullName(person)}</Text>
      <Text style={s.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
    </Page>
  );
}

export function PersonsChapter({ labels }: { labels: PersonsLabels }) {
  const persons = getOrderedPersons();

  return (
    <>
      <Page size="A5" style={[s.pageA5, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={s.chapterTitle}>{labels.chapterPersons}</Text>
      </Page>
      {persons.map((person) => (
        <React.Fragment key={person.id}>
          <PersonInfoPage person={person} labels={labels} />
          <PersonPhotoPage person={person} />
        </React.Fragment>
      ))}
    </>
  );
}
