import type { AutoNoteItem, TranslationMessage } from '../types';

export class NotesService {
  // Analyze a stream of translation messages and produce structured lecture notes
  static generateNotesFromMessages(messages: TranslationMessage[]): AutoNoteItem[] {
    if (!messages || messages.length === 0) return [];

    const notes: AutoNoteItem[] = [];
    const now = Date.now();

    // 1. Overview / Session Topic
    const recentSigns = new Set<string>();
    messages.forEach(m => {
      if (m.rawGlosses) {
        m.rawGlosses.forEach(g => recentSigns.add(g));
      }
    });

    const topicTitle = recentSigns.has('DOCTOR') || recentSigns.has('HELP_SOS')
      ? 'Emergency & Healthcare Sign Communication'
      : recentSigns.has('WATER') || recentSigns.has('THANK_YOU')
      ? 'Everyday Functional ASL & Social Interactions'
      : 'Interactive Sign Language Discourse & Translation';

    notes.push({
      id: 'note-topic-main',
      timestamp: messages[messages.length - 1]?.timestamp || now,
      timeFormatted: new Date(messages[messages.length - 1]?.timestamp || now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'topic',
      title: `Lecture Focus: ${topicTitle}`,
      content: `Live signed communication stream covering ${messages.length} conversational turns with real-time gloss synthesis and grammatical phrasing.`,
      signGlosses: Array.from(recentSigns).slice(0, 8)
    });

    // 2. Synthesize Key Points from paragraphs
    messages.slice(-8).forEach((m, idx) => {
      const isQuestion = m.text.includes('?');
      const isUrgent = m.text.toLowerCase().includes('help') || m.text.toLowerCase().includes('emergency') || m.text.toLowerCase().includes('doctor');
      
      let category: AutoNoteItem['category'] = 'keypoint';
      let title = `Key Insight #${idx + 1}`;

      if (isQuestion) {
        category = 'action';
        title = 'Classroom Inquiry / Clarification Point';
      } else if (isUrgent) {
        category = 'topic';
        title = 'Critical Safety Communication';
      } else if (m.rawGlosses && m.rawGlosses.length > 0) {
        category = 'gloss';
        title = `Sign Structure: [${m.rawGlosses.join(' + ')}]`;
      }

      notes.push({
        id: `note-item-${m.id}`,
        timestamp: m.timestamp,
        timeFormatted: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category,
        title,
        content: m.text,
        signGlosses: m.rawGlosses
      });
    });

    // 3. Glossary Summary Item if signs exist
    if (recentSigns.size > 0) {
      notes.push({
        id: 'note-glossary',
        timestamp: now,
        timeFormatted: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'gloss',
        title: 'Sign Language Vocabulary Encountered',
        content: `Active glosses identified during session: ${Array.from(recentSigns).join(', ')}. Finger shapes matched against Sign Language MNIST dataset reference.`,
        signGlosses: Array.from(recentSigns)
      });
    }

    // 4. Action Item for Review
    notes.push({
      id: 'note-action-review',
      timestamp: now,
      timeFormatted: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'action',
      title: 'Post-Lecture Action Item',
      content: 'Review signed sentence structures and practice finger-spelling sequences in the Pattern Coach and Dataset Lab.'
    });

    return notes;
  }

  // Export notes as clean Markdown text
  static exportNotesToMarkdown(notes: AutoNoteItem[], sessionTitle = 'Live Classroom Lecture'): string {
    const dateStr = new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let md = `# Transisstant Lecture Notes: ${sessionTitle}\n`;
    md += `*Generated automatically on ${dateStr}*\n\n`;
    md += `---------------------------------------------------\n\n`;

    notes.forEach(note => {
      const categoryIcon = note.category === 'topic' ? '📌' : note.category === 'gloss' ? '🤟' : note.category === 'action' ? '✅' : '💡';
      md += `### ${categoryIcon} ${note.title} (${note.timeFormatted})\n`;
      md += `${note.content}\n`;
      if (note.signGlosses && note.signGlosses.length > 0) {
        md += `\n**Associated Sign Glosses:** \`${note.signGlosses.join('`, `')}\`\n`;
      }
      md += `\n`;
    });

    md += `---------------------------------------------------\n`;
    md += `*Transisstant AI - Sign Language Accessibility & Real-Time Classroom Translator*\n`;

    return md;
  }
}
