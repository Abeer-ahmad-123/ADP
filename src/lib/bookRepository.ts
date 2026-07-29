import type { QueryResultRow } from "pg";
import { getPool } from "@/lib/postgres";
import { setSetting } from "@/lib/siteSettings";
import type {
  BookSpread,
  PublicBookContent,
  PublicBookSummary,
} from "@/types/party";

export const BOOK_SETTING_KEYS = {
  author: "book_author",
  pdfHref: "book_pdf_href",
  subtitle: "book_subtitle",
  title: "book_title",
} as const;

type BookPageRow = QueryResultRow & {
  book_id: number;
  page_number: number;
  kicker: string;
  title: string;
  body: string;
  image_src: string | null;
  image_alt: string | null;
};

type BookRow = QueryResultRow & {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  pdf_href: string;
  is_published: boolean;
  page_count?: string | number;
  created_at: Date | string;
  updated_at: Date | string;
};

type SettingRow = QueryResultRow & {
  key: string;
  value: string;
};

const EMPTY_BOOK: PublicBookContent = {
  createdAt: "",
  id: 0,
  author: "",
  pages: [],
  pdfHref: "",
  slug: "",
  subtitle: "",
  title: "",
};

function toBookSpread(row: BookPageRow): BookSpread {
  return {
    body: row.body,
    imageAlt: row.image_alt || undefined,
    imageSrc: row.image_src || undefined,
    kicker: row.kicker,
    pageNumber: Number(row.page_number),
    title: row.title,
  };
}

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function slugifyTitle(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90) || "book"
  );
}

function toBookSummary(row: BookRow): PublicBookSummary {
  return {
    author: row.author || "",
    createdAt: formatDate(row.created_at),
    id: Number(row.id),
    isPublished: row.is_published,
    pageCount: Number(row.page_count || 0),
    pdfHref: row.pdf_href || "",
    slug: row.slug,
    subtitle: row.subtitle || "",
    title: row.title,
  };
}

function toBookContent(row: BookRow, pages: BookSpread[]): PublicBookContent {
  return {
    ...toBookSummary(row),
    pages,
  };
}

async function getLegacyPublicBook(): Promise<PublicBookContent> {
  try {
    const pool = getPool();
    const [settingsResult, pagesResult] = await Promise.all([
      pool.query<SettingRow>(
        `
          select key, value
          from site_settings
          where key = any($1::text[])
        `,
        [Object.values(BOOK_SETTING_KEYS)],
      ),
      pool.query<BookPageRow>(
        `
          select
            0 as book_id,
            page_number,
            kicker,
            title,
            body,
            image_src,
            image_alt
          from book_pages
          order by page_number asc
        `,
      ),
    ]);

    const settings = new Map(
      settingsResult.rows.map((row) => [row.key, row.value]),
    );

    return {
      createdAt: "",
      id: 0,
      author: settings.get(BOOK_SETTING_KEYS.author) || "",
      pages: pagesResult.rows.map(toBookSpread),
      pdfHref: settings.get(BOOK_SETTING_KEYS.pdfHref) || "",
      slug: "",
      subtitle: settings.get(BOOK_SETTING_KEYS.subtitle) || "",
      title: settings.get(BOOK_SETTING_KEYS.title) || "",
    };
  } catch {
    return EMPTY_BOOK;
  }
}

export async function listPublicBooks(): Promise<PublicBookSummary[]> {
  try {
    const pool = getPool();
    const result = await pool.query<BookRow>(
      `
        select
          b.id,
          b.slug,
          b.title,
          b.subtitle,
          b.author,
          b.pdf_href,
          b.is_published,
          b.created_at,
          b.updated_at,
          count(bp.id) as page_count
        from books b
        left join book_pages bp on bp.book_id = b.id
        where b.is_published = true
        group by b.id
        order by b.sort_order asc, b.created_at desc
      `,
    );

    return result.rows.map(toBookSummary);
  } catch {
    const legacyBook = await getLegacyPublicBook();

    return legacyBook.title
      ? [
          {
            author: legacyBook.author,
            createdAt: legacyBook.createdAt,
            id: legacyBook.id,
            isPublished: true,
            pageCount: legacyBook.pages.length,
            pdfHref: legacyBook.pdfHref,
            slug: legacyBook.slug || "book",
            subtitle: legacyBook.subtitle,
            title: legacyBook.title,
          },
        ]
      : [];
  }
}

export async function listAdminBooks() {
  const pool = getPool();
  const result = await pool.query<BookRow>(
    `
      select
        b.id,
        b.slug,
        b.title,
        b.subtitle,
        b.author,
        b.pdf_href,
        b.is_published,
        b.created_at,
        b.updated_at,
        count(bp.id) as page_count
      from books b
      left join book_pages bp on bp.book_id = b.id
      group by b.id
      order by b.sort_order asc, b.created_at desc
    `,
  );

  return result.rows.map(toBookSummary);
}

export async function getBookById(id: number) {
  const pool = getPool();
  const result = await pool.query<BookRow>(
    `
      select
        b.id,
        b.slug,
        b.title,
        b.subtitle,
        b.author,
        b.pdf_href,
        b.is_published,
        b.created_at,
        b.updated_at,
        count(bp.id) as page_count
      from books b
      left join book_pages bp on bp.book_id = b.id
      where b.id = $1
      group by b.id
      limit 1
    `,
    [id],
  );
  const row = result.rows[0];

  return row ? toBookSummary(row) : null;
}

export async function getPublicBook(slug?: string): Promise<PublicBookContent> {
  try {
    const pool = getPool();
    const params: unknown[] = [];
    const slugClause = slug ? "and b.slug = $1" : "";

    if (slug) {
      params.push(slug);
    }

    const bookResult = await pool.query<BookRow>(
      `
        select
          b.id,
          b.slug,
          b.title,
          b.subtitle,
          b.author,
          b.pdf_href,
          b.is_published,
          b.created_at,
          b.updated_at
        from books b
        where b.is_published = true
        ${slugClause}
        order by b.sort_order asc, b.created_at desc
        limit 1
      `,
      params,
    );
    const book = bookResult.rows[0];

    if (!book) {
      return EMPTY_BOOK;
    }

    const pagesResult = await pool.query<BookPageRow>(
      `
        select
          book_id,
          page_number,
          kicker,
          title,
          body,
          image_src,
          image_alt
        from book_pages
        where book_id = $1
        order by page_number asc
      `,
      [book.id],
    );

    return toBookContent(book, pagesResult.rows.map(toBookSpread));
  } catch {
    return getLegacyPublicBook();
  }
}

export async function createBook({
  author,
  pdfHref,
  subtitle,
  title,
}: {
  author: string;
  pdfHref: string;
  subtitle: string;
  title: string;
}) {
  const pool = getPool();
  const baseSlug = slugifyTitle(title);
  const existingSlugResult = await pool.query<{ exists: boolean }>(
    "select exists(select 1 from books where slug = $1)",
    [baseSlug],
  );
  const slug = existingSlugResult.rows[0]?.exists
    ? `${baseSlug}-${Date.now().toString(36)}`
    : baseSlug;
  const result = await pool.query<BookRow>(
    `
      insert into books (
        slug,
        title,
        subtitle,
        author,
        pdf_href,
        is_published,
        sort_order
      )
      values (
        $1,
        $2,
        $3,
        $4,
        $5,
        true,
        (
          select coalesce(max(sort_order), -1) + 1
          from books
        )
      )
      returning
        id,
        slug,
        title,
        subtitle,
        author,
        pdf_href,
        is_published,
        created_at,
        updated_at
    `,
    [slug, title, subtitle, author, pdfHref],
  );

  return result.rows[0] ? toBookSummary(result.rows[0]) : null;
}

export async function updateBook({
  author,
  id,
  isPublished,
  pdfHref,
  subtitle,
  title,
}: {
  author: string;
  id: number;
  isPublished: boolean;
  pdfHref: string;
  subtitle: string;
  title: string;
}) {
  const pool = getPool();
  const result = await pool.query<BookRow>(
    `
      update books
      set
        title = $1,
        subtitle = $2,
        author = $3,
        pdf_href = $4,
        is_published = $5,
        updated_at = now()
      where id = $6
      returning
        id,
        slug,
        title,
        subtitle,
        author,
        pdf_href,
        is_published,
        created_at,
        updated_at
    `,
    [title, subtitle, author, pdfHref, isPublished, id],
  );
  const row = result.rows[0];

  return row ? toBookSummary(row) : null;
}

export async function deleteBook(id: number) {
  const pool = getPool();
  const result = await pool.query(
    `
      delete from books
      where id = $1
    `,
    [id],
  );

  return (result.rowCount || 0) > 0;
}

export async function setBookDetails({
  author,
  bookId,
  subtitle,
  title,
}: {
  author: string;
  bookId?: number;
  subtitle: string;
  title: string;
}) {
  if (bookId) {
    const pool = getPool();
    await pool.query(
      `
        update books
        set
          title = $1,
          subtitle = $2,
          author = $3,
          updated_at = now()
        where id = $4
      `,
      [title, subtitle, author, bookId],
    );
    return;
  }

  await Promise.all([
    setSetting(BOOK_SETTING_KEYS.title, title),
    setSetting(BOOK_SETTING_KEYS.subtitle, subtitle),
    setSetting(BOOK_SETTING_KEYS.author, author),
  ]);
}
