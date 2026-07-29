create table if not exists memberships (
  id bigserial primary key,
  membership_number text not null unique,
  full_name text not null,
  parent_or_spouse_name text not null default '',
  cnic text not null default '',
  residential_address text not null default '',
  city text not null,
  province text not null,
  phone text not null,
  email text not null default '',
  affirms_declaration boolean not null default false,
  confirms_eligibility boolean not null default false,
  joined_on date not null default current_date,
  created_at timestamptz not null default now()
);

alter table memberships
  add column if not exists parent_or_spouse_name text not null default '';

alter table memberships
  add column if not exists cnic text not null default '';

alter table memberships
  add column if not exists residential_address text not null default '';

alter table memberships
  add column if not exists affirms_declaration boolean not null default false;

alter table memberships
  add column if not exists confirms_eligibility boolean not null default false;

drop index if exists memberships_wing_idx;

alter table memberships
  drop column if exists wing;

create index if not exists memberships_created_at_idx on memberships (created_at desc);
create unique index if not exists memberships_cnic_unique_idx
  on memberships (cnic)
  where cnic <> '';
create index if not exists memberships_city_idx on memberships (city);

create table if not exists admin_users (
  id bigserial primary key,
  username text not null unique,
  display_name text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_users_username_idx
  on admin_users (lower(username));

create table if not exists content_entries (
  id bigserial primary key,
  kind text not null check (
    kind in (
      'news',
      'blog',
      'announcement',
      'leadership_profile',
      'audio',
      'video_reel',
      'party_activity'
    )
  ),
  title text not null,
  summary text not null,
  body text,
  person_role text,
  media_url text,
  thumbnail_url text,
  published_at timestamptz not null default now(),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_entries_kind_published_idx
  on content_entries (kind, is_published, published_at desc);

create table if not exists site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create table if not exists books (
  id bigserial primary key,
  slug text not null unique,
  title text not null,
  subtitle text not null default '',
  author text not null default '',
  pdf_href text not null default '',
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists books_published_sort_idx
  on books (is_published, sort_order asc, created_at desc);

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
  'political-pragmatism-in-pakistan',
  coalesce(
    nullif((select value from site_settings where key = 'book_title'), ''),
    'Political Pragmatism in Pakistan'
  ),
  coalesce((select value from site_settings where key = 'book_subtitle'), ''),
  coalesce((select value from site_settings where key = 'book_author'), 'Awam Dost Party'),
  coalesce((select value from site_settings where key = 'book_pdf_href'), ''),
  true,
  0
)
on conflict (slug) do nothing;

create table if not exists book_pages (
  id bigserial primary key,
  book_id bigint,
  page_number integer not null unique,
  kicker text not null default '',
  title text not null default '',
  body text not null default '',
  image_src text,
  image_alt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table book_pages
  add column if not exists book_id bigint;

update book_pages
set book_id = (
  select id
  from books
  where slug = 'political-pragmatism-in-pakistan'
  limit 1
)
where book_id is null;

alter table book_pages
  alter column book_id set not null;

alter table book_pages
  drop constraint if exists book_pages_page_number_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'book_pages_book_id_fkey'
  ) then
    alter table book_pages
      add constraint book_pages_book_id_fkey
      foreign key (book_id) references books(id) on delete cascade;
  end if;
end
$$;

drop index if exists book_pages_page_number_idx;

create unique index if not exists book_pages_book_id_page_number_unique_idx
  on book_pages (book_id, page_number asc);
