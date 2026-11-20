import { describe, expect, it } from 'vitest';

process.env.DATABASE_URL = '';

const db = await import('../../server/api/_db.js');

describe('_db (dev-file mode)', () => {
  it('DB_MODE is dev-file and hasNeon() is false', () => {
    expect(db.DB_MODE).toBe('dev-file');
    expect(db.hasNeon()).toBe(false);
  });

  it('creates a lead and lists it back', async () => {
    const lead = await db.createLead({
      category: 'client',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      ref: 'NGD-UNIT-1',
      message: 'hello from a test',
    });
    expect(lead.id).toBeGreaterThan(0);
    expect(lead.ref).toBe('NGD-UNIT-1');

    const list = await db.listLeads({ page: 1, limit: 50 });
    expect(list.items.some((l) => l.ref === 'NGD-UNIT-1')).toBe(true);
  });

  it('findDupeLead matches same email + category within 45s', async () => {
    await db.createLead({ category: 'client', name: 'Dup', email: 'dup@example.com', ref: 'NGD-UNIT-2' });
    const dupe = await db.findDupeLead('dup@example.com', 'client', 45);
    expect(dupe).not.toBeNull();
    expect(dupe.ref).toBe('NGD-UNIT-2');
  });

  it('findDupeLead ignores other categories and unknown emails', async () => {
    expect(await db.findDupeLead('dup@example.com', 'student', 45)).toBeNull();
    expect(await db.findDupeLead('nope@example.com', 'client', 45)).toBeNull();
  });

  it('assignLead / updateLead / listEvents / deleteLead round-trip', async () => {
    const lead = await db.createLead({
      category: 'student',
      name: 'Grace',
      email: 'g@example.com',
      ref: 'NGD-UNIT-3',
      student_need: 'Portfolio Website',
    });

    const assigned = await db.assignLead(lead.id, 'devil', { username: 'devil', name: 'Devil' });
    expect(assigned.assigned_to).toBe('devil');

    const updated = await db.updateLead(lead.id, { status: 'contacted', actor: { username: 'devil', name: 'Devil' } });
    expect(updated.status).toBe('contacted');

    const events = await db.listEvents(lead.id);
    expect(events.length).toBeGreaterThanOrEqual(2);

    expect(await db.deleteLead(lead.id)).toBe(true);
  });

  it('statsForAdmin returns the series/needs/sources/statuses shape', async () => {
    const stats = await db.statsForAdmin(14);
    expect(Array.isArray(stats.series)).toBe(true);
    expect(Array.isArray(stats.needs)).toBe(true);
    expect(Array.isArray(stats.sources)).toBe(true);
    expect(Array.isArray(stats.statuses)).toBe(true);
  });

  it('listLeads paginates so the export loop sees every row', async () => {
    // The CSV export loops pages of 100; seed enough rows to require a second page.
    for (let i = 0; i < 105; i += 1) {
      await db.createLead({ category: 'client', name: `Seed ${i}`, email: `seed${i}@example.com`, ref: `NGD-SEED-${i}` });
    }
    const page1 = await db.listLeads({ category: 'client', page: 1, limit: 100, sort: 'newest' });
    const page2 = await db.listLeads({ category: 'client', page: 2, limit: 100, sort: 'newest' });
    expect(page1.items.length).toBe(100);
    const all = [...page1.items, ...page2.items];
    expect(page2.items.length).toBeGreaterThan(0);
    expect(all.length).toBe(page1.total); // every row reachable via pagination
    expect(all.length).toBeGreaterThan(100);
  });
});
