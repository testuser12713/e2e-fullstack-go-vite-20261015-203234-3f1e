# Design — Project Identity

> This document is project-long-lived. Tokens are not changed without
> the Architect's approval. Developers MUST use these tokens
> instead of improvising their own colors/spacings.

## Style Direction

Calm, warm paper-like light UI with a deep teal ink accent and amber stars — clean and quiet like Linear, but cozier, suited to a personal reading list.

## Colors

- `--color-bg`: **#FAF8F5**
- `--color-surface`: **#FFFFFF**
- `--color-surface_muted`: **#F3F0EB**
- `--color-fg`: **#1F2328**
- `--color-muted`: **#6B6F76**
- `--color-border`: **#E4E0D9**
- `--color-border_strong`: **#CFC9BF**
- `--color-accent`: **#0F766E**
- `--color-accent_hover`: **#0D6961**
- `--color-accent_active`: **#0A5550**
- `--color-accent_soft`: **#E6F2F0**
- `--color-on_accent`: **#FFFFFF**
- `--color-star`: **#E8A317**
- `--color-star_empty`: **#D6D1C8**
- `--color-status_planned`: **#64748B**
- `--color-status_planned_bg`: **#EEF1F5**
- `--color-status_reading`: **#2563EB**
- `--color-status_reading_bg`: **#E8EFFD**
- `--color-status_read`: **#15803D**
- `--color-status_read_bg`: **#E7F5EC**
- `--color-danger`: **#B42318**
- `--color-danger_bg`: **#FDECEA**
- `--color-focus_ring`: **#0F766E66**

## Typography

- `font_family`: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif
- `heading_weight`: 600
- `body_weight`: 400
- `size_xs`: 12px
- `size_sm`: 14px
- `size_base`: 16px
- `size_lg`: 18px
- `size_xl`: 22px
- `size_2xl`: 28px
- `line_height_body`: 1.5
- `line_height_heading`: 1.25
- `numeric`: font-variant-numeric: tabular-nums for stats, counts and bars

## Spacing Scale

- `--space-0`: 4px
- `--space-1`: 8px
- `--space-2`: 12px
- `--space-3`: 16px
- `--space-4`: 24px
- `--space-5`: 32px
- `--space-6`: 48px

## Border-Radii

- `--radius-sm`: 4px
- `--radius-md`: 8px
- `--radius-lg`: 12px
- `--radius-pill`: 999px

## Components

### Button

Variants: primary (bg=accent, color=on_accent), secondary (bg=surface, 1px border=border_strong, color=fg), ghost (transparent, color=muted), danger-ghost (transparent, color=muted; hover color=danger bg=danger_bg). Padding 10px/18px, radius md, font 15px weight 600, min-height 44px, min-width 44px for icon-only. Hover: primary bg=accent_hover, secondary bg=surface_muted. Active: primary bg=accent_active, translateY(1px). Focus-visible: 3px ring focus_ring, offset 2px. Disabled: opacity 0.5, cursor not-allowed, no hover change. Loading: label kept, small 14px spinner left, disabled. Submit button label 'Hinzufügen'.

### Input

Height 44px, padding 0 12px, bg=surface, 1px border=border_strong, radius md, font 16px (prevents iOS zoom). Label above, 14px weight 500, gap 4px ('Titel', 'Autor'). Placeholder color=muted. Focus: border=accent + 3px ring focus_ring. Error (only after field touched or submit attempted): border=danger, message below 13px color=danger, aria-describedby linked; e.g. 'Bitte einen Titel eingeben.' / 'Bitte einen Autor eingeben.' / 'Maximal 200 Zeichen.'. Disabled: bg=surface_muted, opacity 0.7.

### AddBookForm

Card (surface, 1px border, radius lg, padding 24px; 16px on mobile). Heading 'Buch hinzufügen' 18px/600. Desktop ≥640px: Titel and Autor side by side (flex 1 each, gap 12px) with 'Hinzufügen' button aligned to input baseline; mobile: stacked, button full width. While submitting: button loading, inputs disabled. On success: clear fields, reset touched state, focus Titel.

### FilterTabs

Segmented control: container bg=surface_muted, radius pill, padding 4px. Tabs 'Alle', 'Geplant', 'Lese gerade', 'Gelesen', each min-height 36px inside a 44px-tall container, padding 0 14px, font 14px weight 500, color=muted. Active: bg=surface, color=fg, shadow 0 1px 2px rgba(0,0,0,0.08), radius pill. Optional count after label in muted tabular-nums ('Gelesen 12'). role=tablist, keyboard arrow navigation. On <480px horizontally scrollable, no wrap.

### SearchField

Input variant with 16px magnifier icon left (padding-left 36px), placeholder 'Titel oder Autor suchen …', clear 'x' ghost icon button on the right when non-empty (aria-label 'Suche löschen'). Debounce 300ms. Desktop: sits right of FilterTabs, width 280px; mobile: full width below tabs.

### BookItem

Row inside list card, padding 16px, divider 1px border between rows. Layout: left column title (16px/600, fg, wraps, max 2 lines with ellipsis) and author below (14px, muted). Right/controls column: StatusSelect, StarRating, delete button. Desktop ≥640px: one row, controls right-aligned, gap 16px. Mobile: controls wrap to a second line below the text, StatusSelect left, stars middle, delete right. Hover row bg=surface_muted. While a PATCH is pending: controls of that row disabled with opacity 0.6. If finishedAt set: small 13px muted line 'Gelesen am 14.03.2025'.

### StatusSelect

Native <select> styled: height 36px within a 44px tap area, padding 0 32px 0 12px, radius pill, font 14px weight 500, chevron icon right. Color-coded by value: planned → bg=status_planned_bg color=status_planned; reading → status_reading_bg/status_reading; read → status_read_bg/status_read. Options 'Geplant', 'Lese gerade', 'Gelesen'. aria-label 'Status'. Focus ring as Input.

### StarRating

5 star buttons, each 20px icon inside a 44x44px hit area on mobile (32x32 on desktop pointer:fine, negative margins to keep visual gap 2px). Filled color=star, empty color=star_empty. Hover previews fill up to hovered star. Clicking the current rating clears it to 0. role=radiogroup aria-label 'Bewertung'; each star aria-label '1 Stern' … '5 Sterne'; current star aria-checked. Unrated shows all empty, no text. Disabled while saving: opacity 0.6.

### DeleteButton

Icon-only danger-ghost Button with trash icon 18px, 44x44px, aria-label 'Buch löschen', title 'Löschen'. Hover color=danger bg=danger_bg. Deletes immediately (no modal); row fades out 150ms.

### StatsPanel

Card (surface, border, radius lg, padding 24px). Heading 'Statistik 2025' (current year) 18px/600. Hero metric: label 'Dieses Jahr gelesen' 13px muted uppercase-free, value 40px/700 tabular-nums color=fg. Then 'Ø Bewertung' with value like '4,2' + one filled star icon, or '–' when null. Then MonthBars. Then status counts as three rows: colored 8px dot (status color) + 'Geplant' / 'Lese gerade' / 'Gelesen' + right-aligned count tabular-nums. Sections separated by 20px + 1px divider. Refetches after every create/update/delete; during refetch keep old values (no flicker), optional subtle opacity 0.7.

### MonthBars

12 vertical bars in a CSS grid (12 equal columns, gap 4px), chart height 96px. Bar: bg=accent, radius 3px 3px 0 0, height proportional to max month (min 2px visible stub bg=border for zero). Month labels below, 11px muted: 'J F M A M J J A S O N D' on <480px, else 'Jan Feb Mär Apr Mai Jun Jul Aug Sep Okt Nov Dez'. Current month label weight 600 color=fg. Each bar has title/aria-label 'März: 3 Bücher' ('1 Buch' singular). Container role=img with aria-label summary.

### EmptyState

Centered inside list card, padding 48px 24px. 40px muted book icon, title 16px/600: 'Noch keine Bücher' (empty list) with sub text 14px muted 'Füge oben dein erstes Buch hinzu.'; or 'Keine Treffer' (filter/search active) with sub text 'Passe Filter oder Suche an.' and a secondary Button 'Filter zurücksetzen'.

### LoadingIndicator

Initial list load: 3 skeleton rows (bg=surface_muted, radius sm, pulse animation 1.2s) inside list card, aria-busy=true and visually hidden text 'Lädt …'. Stats loading: skeleton blocks of same size as final content. Inline actions use the 14px spinner in color=accent.

### ErrorBanner

Full-width banner above the list: bg=danger_bg, 1px border #F5C2BC, color=danger, radius md, padding 12px 16px, alert icon left, role=alert. Text in German, e.g. 'Server nicht erreichbar. Bitte später erneut versuchen.' or the API error message prefixed 'Fehler: '. Secondary small Button 'Erneut versuchen' right (wraps below on mobile) and ghost close icon (aria-label 'Schließen'). Action-level errors (failed PATCH/DELETE) use the same banner and revert the optimistic change.

### AppHeader

Top of page, padding 24px 0 16px. Title 'Meine Leseliste' 28px/600 (22px on mobile), subtitle 14px muted e.g. '12 Bücher' (count of all books, '1 Buch' singular). No nav needed.

## Layout Principles

- Page bg=bg; content container max-width 1080px, centered, horizontal padding 16px (<640px), 24px (≥640px).
- Breakpoints: mobile 360–639px, tablet 640–959px, desktop ≥960px. Must work without horizontal scroll at 360px.
- Desktop ≥960px: two-column grid 'minmax(0,1fr) 320px', gap 24px. Left column: AddBookForm, then toolbar (FilterTabs + SearchField in one row, space-between), ErrorBanner if any, then list card. Right column: StatsPanel, position sticky top 24px.
- Below 960px: single column in order AppHeader, AddBookForm, toolbar, ErrorBanner, list card, StatsPanel.
- Vertical rhythm: 24px between major blocks, 16px inside cards, 12px between related controls. Spacing only from the scale.
- Cards: bg=surface, 1px border=border, radius lg, no heavy shadows (max 0 1px 2px rgba(0,0,0,0.04)).
- All interactive targets ≥44x44px touch area; visible focus-visible ring everywhere.
- Dates: German format DD.MM.YYYY (e.g. '14.03.2025') via Intl.DateTimeFormat('de-DE', {day:'2-digit', month:'2-digit', year:'numeric'}); no times shown.
- Months: German short names 'Jan Feb Mär Apr Mai Jun Jul Aug Sep Okt Nov Dez' (single letters below 480px); full names in tooltips/aria ('März').
- Average rating: one decimal with German comma via Intl.NumberFormat('de-DE', {minimumFractionDigits:1, maximumFractionDigits:1}) e.g. '4,2'; null renders as '–' (en dash).
- Counts: plain integers, tabular-nums, with German singular/plural ('1 Buch', '3 Bücher').
- Year shown as 4-digit current year from the client clock (e.g. 'Statistik 2025').
- All UI strings are German exactly as specified: 'Titel', 'Autor', 'Hinzufügen', 'Alle', 'Geplant', 'Lese gerade', 'Gelesen', 'Dieses Jahr gelesen', 'Noch keine Bücher', 'Keine Treffer'.
