# SoundForge — Requirements Document

## 1. Преглед на продукта

### 1.1 Видение
SoundForge е социална мрежа за AI генерирана музика — "Sora 2, но за музика". Платформата комбинира генеративен AI инструмент за създаване на музика чрез текстови prompt-ове със социална мрежа в стил TikTok / SoundCloud, където потребителите могат да споделят, ремиксват и колаборират върху треци.

### 1.2 Мисия
Да направим музикалното творчество достъпно за всеки — независимо дали има музикално образование — и да изградим общност около AI-генерирана музика.

### 1.3 Уникална стойност
- Пълен creative loop: генериране → споделяне → ремикс → колаборация
- Vertical feed формат, оптимизиран за откриване на музика
- Fork / remix механика, която третира музиката като отворен код
- Royalty-free съдържание за creators

---

## 2. Целева аудитория

| Сегмент | Описание | Основна нужда |
|---|---|---|
| Любители без музикално образование | Хора, които искат да създават музика без бариери | Лесен инструмент за себеизразяване |
| Продуценти | Професионалисти, които търсят вдъхновение | Бързи скици, идеи, нестандартни жанрови комбинации |
| Слушатели | Хора, които търсят уникален звук | Откриване на нестандартна музика |
| Content creators | TikTok / Reels / Shorts автори | Royalty-free музика за съдържание |

---

## 3. Функционални изисквания (MVP)

### 3.1 Генериране на трек
- Текстов prompt input (multi-line, max 500 символа)
- Избор на жанр (предефиниран списък + free-text)
- Избор на настроение (mood tags)
- Избор на дължина (15s, 30s, 60s, 2min, 3min)
- Vocals on/off toggle
- Опционално: instrumental, BPM, key
- Preview преди публикуване
- Запазване като draft
- Публикуване в публичния feed

### 3.2 Vertical feed
- TikTok-style вертикален scroll
- Auto-play на следващия трек
- Waveform визуализация (Web Audio API)
- Cover art (AI-генериран или потребителски upload)
- Бутони за действия: like, comment, save, share, remix
- Swipe нагоре за следващ, swipe надолу за предишен
- "For you" алгоритъм (default tab)
- "Following" tab за треци от последователи
- "Trending" tab

### 3.3 Социални действия
- **Like** — двоен tap или сърце икона
- **Save** — добавяне в личната колекция
- **Repost** — споделяне в собствения профил
- **Comment** — текстови коментари с реплики
- **Follow / Unfollow** — последване на потребители
- **Share** — външен линк, embed, copy link
- **Report** — за неподходящо съдържание

### 3.4 Remix / Fork
- "Remix" бутон на всеки трек
- Запазва се parent reference (fork tree)
- Опции за remix:
  - Промяна на жанр
  - Промяна на темпо / BPM
  - Добавяне на vocals
  - Промяна на mood
  - Промяна / разширяване на prompt
- Версиите се визуализират като дърво (родителски / дъщерни треци)
- Кредит към оригиналния автор автоматично

### 3.5 Колаборации
- Покана за колаборация на конкретен трек
- Двама (или повече) потребители работят по един трек
- Layer-based редакция (всеки добавя слой: drums, bass, vocals, etc.)
- Realtime индикатор кой работи в момента
- Версии и история на промените
- Финален mix се публикува с двата (или повече) автора като co-creators

### 3.6 Откриване
- **Hashtags** — потребителски и trending
- **Жанрове** — предефинирани категории
- **Trending** — топ треци за период (day, week, month)
- **"For you"** препоръки — на база listening history, likes, follows, pgvector similarity
- **Search** — по prompt, потребител, hashtag, жанр

### 3.7 Профил
- Avatar, био (max 200 символа), линк
- Статистики: общо плеи, последователи, следвани, треци
- Pinned треци (max 3)
- Tabs: Tracks, Remixes, Liked, Playlists
- Edit profile screen
- Public / private профил toggle

### 3.8 Плейлисти
- Създаване на собствени плейлисти
- Public / private видимост
- Добавяне / премахване на треци
- Reorder на треци
- Cover art (auto или upload)
- Споделяне чрез линк
- Embed widget (iframe) за външни сайтове

---

## 4. Не-функционални изисквания

### 4.1 Производителност
- First Contentful Paint < 1.5s
- Audio playback стартира < 500ms след tap
- Feed scroll 60fps на mid-range mobile
- AI генерация: feedback за прогрес, max 60s за стандартен трек

### 4.2 Скалируемост
- Поддръжка на 10k concurrent listeners в MVP
- Audio CDN за глобална доставка
- Background queue за AI jobs

### 4.3 Достъпност
- WCAG 2.1 AA
- Keyboard navigation за плейър
- Captions / transcripts за вокални треци (Whisper)

### 4.4 Сигурност
- RLS политики на всички таблици
- Rate limiting на AI генерация (per user, per IP)
- Content moderation за prompt-ове и cover art
- Secure file upload (MIME validation, virus scan)

### 4.5 Privacy & съдържание
- Право на изтриване на профил и треци
- GDPR съответствие
- Content moderation policy (NSFW, copyright, hate speech)
- DMCA процес

---

## 5. Технологичен стак

### 5.1 Frontend & Backend
- **Next.js (App Router)** — full-stack framework
- **API routes / Server Actions** — целият backend
- **Tailwind CSS** — styling
- **Web Audio API** — плейър и waveform визуализация
- **TypeScript** — type safety

### 5.2 AI слой
- **Music generation API** — Suno / Udio-подобен или self-hosted модел
- **Whisper** — транскрипция на вокали
- **Voice cloning модел** — за персонализирани вокали
- Извиквани от Next.js route handlers

### 5.3 DB & Storage
- **Supabase Postgres** — основна база данни
- **pgvector** — similarity търсене и препоръки
- **Supabase Storage** — аудио файлове, cover art
- **Supabase Realtime** — live updates по feed-а, колаборации

### 5.4 Auth
- **Supabase Auth** — email, OAuth (Google, Apple), magic links
- **RLS политики** — директно върху таблиците

### 5.5 Payments
- **Stripe** — интегриран през Next.js route handlers
- **Supabase webhooks** — за синхронизация на статуси

### 5.6 Background jobs
- **Supabase Edge Functions** — heavy AI jobs
- **pg_cron** — scheduled tasks (trending изчисления, cleanup)
- Опашки за AI генерация

---

## 6. Модел на данните (high-level)

### Основни таблици
- `users` — профили, био, статистики
- `tracks` — треци (audio URL, prompt, жанр, mood, parent_id за remix tree)
- `track_layers` — слоеве при колаборации
- `likes`, `saves`, `reposts`, `comments` — социални действия
- `follows` — relations между потребители
- `playlists`, `playlist_tracks` — плейлисти
- `hashtags`, `track_hashtags` — таги
- `collaborations` — покани и активни колаборации
- `plays` — listening history (за препоръки)
- `track_embeddings` — pgvector embeddings за similarity

### Релации
- Track → User (creator)
- Track → Track (parent / remix)
- Track → Users (collaborators, many-to-many)
- User → Users (follows, many-to-many)

---

## 7. User flows (key)

### 7.1 Първо генериране на трек
1. Onboarding / login
2. CTA "Create your first track"
3. Prompt input + опции
4. Loading state с прогрес
5. Preview screen
6. Публикуване или save as draft

### 7.2 Remix flow
1. Слушане на трек във feed
2. Tap "Remix"
3. Pre-filled prompt с оригинала
4. Промяна на параметрите
5. Генериране
6. Публикуване с автоматичен кредит към оригинала

### 7.3 Колаборация
1. Покана от профил или от трек
2. Приемане
3. Споделен work-space с layers
4. Realtime индикатор за активност
5. Финален mix → публикуване с co-credits

---

## 8. Монетизация (post-MVP)

- **Free tier** — лимит на генерации/ден
- **Pro tier** — неограничени генерации, по-високо качество, премиум жанрове, voice cloning
- **Creator tier** — analytics, royalty-free лиценз, commercial use
- **Tips / Donations** — между потребители
- **Embed monetization** — за external сайтове

---

## 9. Метрики за успех

| Метрика | Цел за MVP |
|---|---|
| DAU / MAU | 20%+ |
| Avg session length | 8+ min |
| Tracks created per active user / week | 2+ |
| Remix rate (% от треци, които получават поне 1 remix) | 10%+ |
| Day 7 retention | 25%+ |
| Day 30 retention | 12%+ |

---

## 10. Roadmap (high-level)

### Phase 1 — MVP (3-4 месеца)
- Auth, профили
- Генериране (basic)
- Vertical feed
- Социални действия (like, save, comment, follow)
- Базови плейлисти

### Phase 2 — Remix & Discovery
- Remix / fork mechanics
- Hashtags, trending
- "For you" препоръки
- Search

### Phase 3 — Колаборации
- Layer-based редакция
- Realtime co-editing
- Co-credits

### Phase 4 — Монетизация
- Stripe интеграция
- Pro / Creator tiers
- Tips
- Commercial licensing

---

## 11. Рискове и митигация

| Риск | Митигация |
|---|---|
| Copyright / IP claims върху AI музика | Ясни ToS, content moderation, DMCA процес |
| Качество на AI генерация | A/B тестване на модели, fallback опции |
| Cost на AI inference | Rate limiting, caching, tier-based лимити |
| Cold start на feed | Seed съдържание, инфлуенсъри, curation |
| Модериране на съдържание | Auto-moderation + human review queue |

---

## 12. Извън обхвата (за сега)
- Mobile native apps (iOS / Android) — web-first MVP
- Live streaming / live колаборация с аудио
- DAW-style редакция на ниво нота
- Marketplace за продажба на треци
- NFT / blockchain интеграция
