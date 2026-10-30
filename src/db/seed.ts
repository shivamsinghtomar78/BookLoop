// QA/demo seed — isolated Neon branch ONLY.
//
// Run: npm run db:test:seed   (after npm run db:test:push)
//
// - Reads .env.test.local through the shared guard; refuses production.
// - Uses pg + one transaction (Neon's HTTP driver cannot roll back).
// - Wipes and reseeds every domain + auth table, then writes a run marker in
//   _bookloop_test_meta so preflight can detect a stale or foreign seed.
//
// Accounts (password for all): Bookloop!2345
//   seller1..5 / buyer1..4 @test.bookloop.local + the ADMIN_EMAILS admin.
// Data: 55 listings across classes 6–12 and JEE, exchange + donate, three
// chats (negotiating / reserved / completed), wishlist, alerts, notifications.

import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";
import { assertTestDb } from "../../scripts/lib/test-db.mjs";
import { altPhotoFor, photoFor } from "./seed-photos";

const PASSWORD = "Bookloop!2345";
const SCHOOL = "Pilot Public School";

type Category = "textbook" | "reference" | "competitive" | "novel";
type Mode = "sell" | "exchange" | "donate";
type Condition = "like_new" | "good" | "fair" | "worn";
type Status = "active" | "reserved" | "closed";

type Account = {
  key: string;
  fullName: string;
  klass: number;
  age: number;
  role: "seller" | "buyer" | "admin";
  verified: boolean;
};

type ListingSeed = {
  sellerKey: string;
  title: string;
  category: Category;
  mode: Mode;
  klass?: number;
  subject?: string;
  exam?: string;
  genre?: string;
  author?: string;
  editionYear?: string;
  condition: Condition;
  price?: number;
  wants?: string;
  status: Status;
};

const ACCOUNTS: Account[] = [
  { key: "seller1", fullName: "Asha Verma", klass: 9, age: 14, role: "seller", verified: true },
  { key: "seller2", fullName: "Rohan Iyer", klass: 8, age: 13, role: "seller", verified: true },
  { key: "seller3", fullName: "Meera Khan", klass: 10, age: 15, role: "seller", verified: true },
  { key: "seller4", fullName: "Kabir Sethi", klass: 11, age: 16, role: "seller", verified: true },
  { key: "seller5", fullName: "Nisha Rao", klass: 12, age: 17, role: "seller", verified: true },
  { key: "buyer1", fullName: "Ishaan Gupta", klass: 9, age: 14, role: "buyer", verified: true },
  { key: "buyer2", fullName: "Diya Menon", klass: 8, age: 13, role: "buyer", verified: true },
  { key: "buyer3", fullName: "Arjun Bose", klass: 10, age: 15, role: "buyer", verified: true },
  // Pending school-ID approval — exercises the admin queue.
  { key: "buyer4", fullName: "Zoya Ali", klass: 7, age: 12, role: "buyer", verified: false },
];

const CONDITIONS: Condition[] = ["like_new", "good", "fair", "worn"];
const SELLER_KEYS = ACCOUNTS.filter((a) => a.role === "seller").map((a) => a.key);

function emailFor(key: string) {
  return `${key}@test.bookloop.local`;
}

function studentIdFor(i: number) {
  return `QA${String(100_000_000 + i).slice(-9)}`; // 11 chars: QA + 9 digits
}

function buildListings(): ListingSeed[] {
  const rows: ListingSeed[] = [];
  let sellerIndex = 0;
  const seller = () => SELLER_KEYS[sellerIndex++ % SELLER_KEYS.length];

  // 27 textbooks across classes 6–12 (class 12 gets three subjects).
  for (const klass of [6, 7, 8, 9, 10, 11, 12]) {
    const subjects = klass === 12 ? ["Maths", "Science", "English"] : ["Maths", "Science", "English", "Hindi"];
    for (const subject of subjects) {
      rows.push({
        sellerKey: seller(),
        title: `${subject} Textbook — Class ${klass}`,
        category: "textbook",
        mode: "sell",
        klass,
        subject,
        editionYear: klass >= 10 ? "2025" : "2024",
        condition: CONDITIONS[rows.length % CONDITIONS.length],
        price: 40 + ((rows.length * 13) % 150),
        status: "active",
      });
    }
  }

  // 8 reference guides.
  const reference = [
    { klass: 8, subject: "Science" },
    { klass: 8, subject: "Maths" },
    { klass: 9, subject: "Maths" },
    { klass: 9, subject: "English" },
    { klass: 10, subject: "Science" },
    { klass: 10, subject: "Maths" },
    { klass: 11, subject: "Physics" },
    { klass: 12, subject: "Maths" },
  ];
  for (const row of reference) {
    rows.push({
      sellerKey: seller(),
      title: `${row.subject} Practice Guide — Class ${row.klass}`,
      category: "reference",
      mode: "sell",
      klass: row.klass,
      subject: row.subject,
      editionYear: "2025",
      condition: CONDITIONS[rows.length % CONDITIONS.length],
      price: 110 + ((rows.length * 17) % 90),
      status: "active",
    });
  }

  // 4 competitive-exam books (JEE + Olympiad).
  const competitive = [
    { subject: "Physics", exam: "JEE", title: "Physics Problem Book (JEE Main)", price: 250 },
    { subject: "Chemistry", exam: "JEE", title: "Organic Chemistry Workbook (JEE Main)", price: 220 },
    { subject: "Maths", exam: "JEE", title: "JEE Main Maths — Volume 1", price: 200 },
    { subject: "Maths", exam: "Olympiad", title: "Olympiad Maths Workbook", price: 180 },
  ];
  for (const row of competitive) {
    rows.push({
      sellerKey: seller(),
      title: row.title,
      category: "competitive",
      mode: "sell",
      subject: row.subject,
      exam: row.exam,
      condition: CONDITIONS[rows.length % CONDITIONS.length],
      price: row.price,
      status: "active",
    });
  }

  // 8 exchanges (classes 6–9, two per class).
  for (const klass of [6, 7, 8, 9]) {
    for (const subject of ["Science", "English"]) {
      rows.push({
        sellerKey: seller(),
        title: `${subject} Textbook — Class ${klass} (swap)`,
        category: "textbook",
        mode: "exchange",
        klass,
        subject,
        condition: CONDITIONS[rows.length % CONDITIONS.length],
        wants: subject === "Science" ? `Class ${klass} Maths` : `Class ${klass} Hindi`,
        status: "active",
      });
    }
  }

  // 8 donations (classes 6–12 + one story collection).
  const donateSubjects = ["Maths", "Science", "English", "Hindi", "Social Science", "English", "Maths"];
  donateSubjects.forEach((subject, i) => {
    rows.push({
      sellerKey: seller(),
      title: `${subject} Textbook — Class ${i + 6} (free)`,
      category: "textbook",
      mode: "donate",
      klass: i + 6,
      subject,
      condition: CONDITIONS[rows.length % CONDITIONS.length],
      status: "active",
    });
  });
  rows.push({
    sellerKey: seller(),
    title: "Story Collection (English) — free",
    category: "novel",
    mode: "donate",
    genre: "Short stories",
    author: "Various",
    condition: "good",
    status: "active",
  });

  if (rows.length !== 55) {
    throw new Error(`Seed listing plan must contain exactly 55 rows (got ${rows.length}).`);
  }

  // Chat-driven states: one negotiating, one reserved, one completed.
  rows[0].status = "active";
  rows[4].status = "reserved";
  rows[27].status = "closed";
  return rows;
}

async function insertJson(client: import("pg").PoolClient, sql: string, rows: unknown[]) {
  return client.query(sql, [JSON.stringify(rows)]);
}

async function seed() {
  const cfg = await assertTestDb({ quiet: true });

  const pool = new Pool({ connectionString: cfg.unpooled, max: 1 });
  const client = await pool.connect();
  const started = Date.now();
  try {
    await client.query("begin");

    await client.query(`
      truncate table ratings, transactions, messages, chats, notifications,
        wishlist_items, book_alerts, listing_photos, photo_blobs, listings, feedback,
        users, session, account, verification, "user"
      restart identity cascade
    `);

    const passwordHash = await hashPassword(PASSWORD);
    const adminEmail = (process.env.ADMIN_EMAILS ?? "admin@test.bookloop.local")
      .split(",")[0]
      .trim();

    const people = [
      ...ACCOUNTS.map((a) => ({
        authId: `qa-auth-${a.key}`,
        accountId: `qa-auth-${a.key}`,
        email: emailFor(a.key),
        fullName: a.fullName,
        klass: a.klass,
        age: a.age,
        studentId: studentIdFor(ACCOUNTS.indexOf(a) + 1),
        verified: a.verified,
      })),
      {
        authId: "qa-auth-admin",
        accountId: "qa-auth-admin",
        email: adminEmail,
        fullName: "QA Admin",
        klass: 12,
        age: 18,
        studentId: studentIdFor(99),
        verified: true,
      },
    ];

    await insertJson(
      client,
      `insert into "user" (id, name, email, email_verified)
       select id, name, email, true
         from json_to_recordset($1::json) as x(id text, name text, email text)`,
      people.map((p) => ({ id: p.authId, name: p.fullName, email: p.email })),
    );

    await insertJson(
      client,
      `insert into account (id, account_id, provider_id, user_id, password, created_at, updated_at)
       select id, account_id, 'credential', user_id, password, now(), now()
         from json_to_recordset($1::json)
           as x(id text, account_id text, user_id text, password text)`,
      people.map((p) => ({
        id: `qa-account-${p.authId}`,
        account_id: p.accountId,
        user_id: p.authId,
        password: passwordHash,
      })),
    );

    const profileResult = await insertJson(
      client,
      `insert into users
         (auth_id, full_name, school_name, age, class, email, email_confirmed,
          student_id, verified)
       select auth_id, full_name, school_name, age, class, email, true,
              student_id, verified
         from json_to_recordset($1::json) as x(
           auth_id text, full_name text, school_name text, age int, class int,
           email text, student_id text, verified boolean)
       returning id, email`,
      people.map((p) => ({
        auth_id: p.authId,
        full_name: p.fullName,
        school_name: SCHOOL,
        age: p.age,
        class: p.klass,
        email: p.email,
        student_id: p.studentId,
        verified: p.verified,
      })),
    );

    const profileByEmail = new Map<string, number>(
      profileResult.rows.map((r) => [r.email as string, r.id as number]),
    );
    const profileId = (key: string) => {
      const id = profileByEmail.get(emailFor(key));
      if (!id) throw new Error(`Missing seeded profile for ${key}`);
      return id;
    };

    const listingSeeds = buildListings();
    const listingRows = listingSeeds.map((row, i) => ({
      bookloop_id: `BL-${String(i + 1).padStart(4, "0")}`,
      seller_id: profileId(row.sellerKey),
      title: row.title,
      category: row.category,
      mode: row.mode,
      class: row.klass ?? null,
      subject: row.subject ?? null,
      exam: row.exam ?? null,
      genre: row.genre ?? null,
      author: row.author ?? null,
      edition_year: row.editionYear ?? null,
      condition: row.condition,
      price_inr: row.mode === "sell" ? row.price ?? null : null,
      wants_book: row.mode === "exchange" ? row.wants ?? null : null,
      status: row.status,
    }));

    const inserted = await insertJson(
      client,
      `insert into listings
         (bookloop_id, seller_id, title, category, mode, class, subject, exam,
          genre, author, edition_year, condition, price_inr, wants_book, status)
       select bookloop_id, seller_id, title, category::category, mode::mode,
              class, subject, exam, genre, author, edition_year,
              condition::condition, price_inr, wants_book,
              status::listing_status
         from json_to_recordset($1::json) as x(
           bookloop_id text, seller_id int, title text, category text, mode text,
           class int, subject text, exam text, genre text, author text,
           edition_year text, condition text, price_inr int, wants_book text,
           status text)
       returning id, bookloop_id`,
      listingRows,
    );

    const listingByCode = new Map<string, number>(
      inserted.rows.map((r) => [r.bookloop_id as string, r.id as number]),
    );
    const listingId = (index: number) => {
      const id = listingByCode.get(`BL-${String(index + 1).padStart(4, "0")}`);
      if (!id) throw new Error(`Missing seeded listing #${index + 1}`);
      return id;
    };

    const photoRows = listingSeeds.flatMap((row, i) => [
      {
        listing_id: listingId(i),
        url: photoFor(row.category, i),
        sort_order: 1,
      },
      {
        listing_id: listingId(i),
        url: altPhotoFor(row.category, i),
        sort_order: 2,
      },
    ]);
    await insertJson(
      client,
      `insert into listing_photos (listing_id, url, sort_order)
       select listing_id, url, sort_order
         from json_to_recordset($1::json)
           as x(listing_id int, url text, sort_order int)`,
      photoRows,
    );

    const buyer1 = profileId("buyer1");
    const buyer2 = profileId("buyer2");
    const buyer3 = profileId("buyer3");
    const buyer4 = profileId("buyer4");

    const chatSeeds = [
      { listingIndex: 0, buyerId: buyer1, state: "negotiating" },
      { listingIndex: 4, buyerId: buyer2, state: "reserved" },
      { listingIndex: 27, buyerId: buyer3, state: "completed" },
    ];
    const chatInsert = await insertJson(
      client,
      `insert into chats (listing_id, buyer_id)
       select listing_id, buyer_id
         from json_to_recordset($1::json) as x(listing_id int, buyer_id int)
       returning id, listing_id`,
      chatSeeds.map((c) => ({ listing_id: listingId(c.listingIndex), buyer_id: c.buyerId })),
    );
    const chatByListing = new Map<number, number>(
      chatInsert.rows.map((r) => [r.listing_id as number, r.id as number]),
    );
    const chatIdsBySeed = chatSeeds.map((c) => {
      const id = chatByListing.get(listingId(c.listingIndex));
      if (!id) throw new Error(`Missing seeded chat for listing #${c.listingIndex + 1}`);
      return id;
    });
    const chatId = (seedIndex: number) => {
      const id = chatIdsBySeed[seedIndex];
      if (!id) throw new Error(`Missing seeded chat #${seedIndex + 1}`);
      return id;
    };

    const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
    const messageSeeds = [
      { chat: 0, sender: buyer1, body: "Hi! Is the Class 6 Maths book still available?", at: minutesAgo(55) },
      { chat: 0, sender: profileId(listingSeeds[0].sellerKey), body: "Yes, it is. It has a few pencil notes.", at: minutesAgo(52) },
      { chat: 0, sender: buyer1, body: "That's fine. Would ₹80 work?", at: minutesAgo(48) },
      { chat: 0, sender: profileId(listingSeeds[0].sellerKey), body: "₹80 works — I can bring it tomorrow.", at: minutesAgo(45) },

      { chat: 1, sender: buyer2, body: "Is the Class 7 Science swap still open?", at: minutesAgo(180) },
      { chat: 1, sender: profileId(listingSeeds[4].sellerKey), body: "Yes — I need a Class 7 Maths book.", at: minutesAgo(176) },
      { chat: 1, sender: buyer2, body: "Perfect, I have the Maths one. Reserved it?", at: minutesAgo(172) },
      { chat: 1, sender: profileId(listingSeeds[4].sellerKey), body: "Reserved for you. Library at lunch?", at: minutesAgo(170) },

      { chat: 2, sender: buyer3, body: "Do you still have the Class 8 Science guide?", at: minutesAgo(3000) },
      { chat: 2, sender: profileId(listingSeeds[27].sellerKey), body: "Yes, solved papers included.", at: minutesAgo(2990) },
      { chat: 2, sender: buyer3, body: "Great, I'll take it.", at: minutesAgo(2980) },
      { chat: 2, sender: profileId(listingSeeds[27].sellerKey), body: "Handed it over at the library — thanks!", at: minutesAgo(2900) },
      { chat: 2, sender: buyer3, body: "Received, thank you!", at: minutesAgo(2890) },
    ];
    await insertJson(
      client,
      `insert into messages (chat_id, sender_id, body, created_at)
       select chat_id, sender_id, body, created_at
         from json_to_recordset($1::json) as x(
           chat_id int, sender_id int, body text, created_at timestamptz)`,
      messageSeeds.map((m) => ({
        chat_id: chatId(m.chat),
        sender_id: m.sender,
        body: m.body,
        created_at: m.at,
      })),
    );

    const transactionSeeds = chatSeeds
      .filter((c) => c.state !== "negotiating")
      .map((c) => {
        const row = listingSeeds[c.listingIndex];
        return {
          listing_id: listingId(c.listingIndex),
          seller_id: profileId(row.sellerKey),
          buyer_id: c.buyerId,
          mode: row.mode,
          price_inr: row.mode === "sell" ? row.price ?? null : null,
          seller_marked_at: c.state === "completed" ? minutesAgo(2950) : minutesAgo(165),
          buyer_confirmed_at: c.state === "completed" ? minutesAgo(2890) : null,
        };
      });
    const txInsert = await insertJson(
      client,
      `insert into transactions
         (listing_id, seller_id, buyer_id, mode, price_inr, seller_marked_at,
          buyer_confirmed_at)
       select listing_id, seller_id, buyer_id, mode::mode, price_inr,
              seller_marked_at, buyer_confirmed_at
         from json_to_recordset($1::json) as x(
           listing_id int, seller_id int, buyer_id int, mode text, price_inr int,
           seller_marked_at timestamptz, buyer_confirmed_at timestamptz)
       returning id, listing_id`,
      transactionSeeds,
    );
    const completedTxId = txInsert.rows.find(
      (r) => r.listing_id === listingId(27),
    )?.id as number | undefined;

    if (completedTxId) {
      await client.query(
        `insert into ratings (transaction_id, rater_id, ratee_id, thumbs_up)
         values ($1, $2, $3, true)`,
        [completedTxId, buyer3, profileId(listingSeeds[27].sellerKey)],
      );
    }

    await insertJson(
      client,
      `insert into wishlist_items (user_id, listing_id)
       select user_id, listing_id
         from json_to_recordset($1::json) as x(user_id int, listing_id int)`,
      [
        { user_id: buyer1, listing_id: listingId(1) },
        { user_id: buyer1, listing_id: listingId(30) },
        { user_id: buyer2, listing_id: listingId(42) },
      ],
    );

    await insertJson(
      client,
      `insert into book_alerts (user_id, keyword, category, class, subject)
       select user_id, keyword, category::category, class, subject
         from json_to_recordset($1::json) as x(
           user_id int, keyword text, category text, class int, subject text)`,
      [
        { user_id: buyer1, keyword: "JEE", category: "competitive", class: null, subject: "Physics" },
        { user_id: buyer4, keyword: null, category: "textbook", class: 9, subject: "Maths" },
      ],
    );

    await insertJson(
      client,
      `insert into notifications (user_id, type, text, listing_id, read_at)
       select user_id, type::notification_type, text, listing_id,
              case when read_at is null then null else read_at::timestamptz end
         from json_to_recordset($1::json) as x(
           user_id int, type text, text text, listing_id int, read_at text)`,
      [
        {
          user_id: buyer2,
          type: "chat_message",
          text: "Asha replied about your reservation",
          listing_id: listingId(4),
          read_at: null,
        },
        {
          user_id: buyer1,
          type: "alert_match",
          text: "A new JEE Physics book matches your alert",
          listing_id: listingId(31),
          read_at: null,
        },
        {
          user_id: buyer3,
          type: "confirm_handover",
          text: "Confirm you received the Science guide",
          listing_id: listingId(27),
          read_at: minutesAgo(2880),
        },
      ],
    );

    await client.query(`
      create table if not exists _bookloop_test_meta (
        run_id text primary key,
        label text not null,
        seeded_at timestamptz not null default now()
      )
    `);
    await client.query("delete from _bookloop_test_meta");
    await client.query(
      "insert into _bookloop_test_meta (run_id, label) values ($1, $2)",
      [`${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, cfg.label],
    );

    await client.query("commit");

    const { rows: counts } = await client.query(
      `select
         (select count(*) from users) as users,
         (select count(*) from listings) as listings,
         (select count(*) from chats) as chats,
         (select count(*) from messages) as messages`,
    );
    const c = counts[0];
    console.log(
      `✓ seeded ${cfg.maskedHost} (branch "${cfg.label}") in ${((Date.now() - started) / 1000).toFixed(1)}s: ` +
        `${c.users} users · ${c.listings} listings · ${c.chats} chats · ${c.messages} messages`,
    );
    console.log(`  test logins: ${emailFor("seller1")} / ${emailFor("buyer1")} / admin (password ${PASSWORD})`);
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end().catch(() => {});
  }
}

seed().catch((err) => {
  console.error(`\nSeed failed: ${err.message}\n`);
  process.exit(1);
});
