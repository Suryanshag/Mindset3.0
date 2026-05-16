# UI Audit — 2026-05-16T16-59-30

Base URL: https://mindset-ten.vercel.app
Viewport: 1440 × 900 (chromium headless)
Test account (engaged): choudharysuryansh1111@gmail.com
Test account (empty): audit-empty-1778946648892@mindset.test

Seeded data on engaged account:
- Upcoming session (cmp8iwkr500051327fic8ymu6): CONFIRMED, ~3 days out, Dr. Ananya Sharma
- Past session (cmp86o4b5000104l4w0vkj6dl): existing pre-seed
- 2 journal entries (one detailed, one short)
- 2 assignments (1 pending, 1 completed)
- 1 published workshop + registration
- 1 cart item (Mindset Gratitude Journal)
- 1 delivered order (cmp8jjry50001jv27j2brvoai)

## Engaged-user captures (25)

- `user-home--engaged.png` — `/user`
- `user-reflection-today--engaged.png` — `/user/reflection/today`
- `user-sessions--engaged.png` — `/user/sessions`
- `user-sessions-detail-upcoming--engaged.png` — `/user/sessions/cmp8iwkr500051327fic8ymu6`
- `user-sessions-detail-past--engaged.png` — `/user/sessions/cmp86o4b5000104l4w0vkj6dl`
- `user-sessions-book-list--engaged.png` — `/user/sessions/book`
- `user-sessions-book-doctor--engaged.png` — `/user/sessions/book?doctorId=cmmk305d40002tb3e378vjp5f`
- `user-practice--engaged.png` — `/user/practice`
- `user-practice-journal--engaged.png` — `/user/practice/journal`
- `user-practice-journal-new--engaged.png` — `/user/practice/journal/new`
- `user-practice-journal-detail--engaged.png` — `/user/practice/journal/cmp8iwk5q00001327w9r950q9`
- `user-practice-assignments--engaged.png` — `/user/practice/assignments`
- `user-practice-assignments-detail--engaged.png` — `/user/practice/assignments/cmp8iwkd200021327xlw3tjkk`
- `user-practice-mindfulness--engaged.png` — `/user/practice/mindfulness` _[HTTP 404]_
- `user-discover--engaged.png` — `/user/discover`
- `user-discover-workshops--engaged.png` — `/user/discover/workshops`
- `user-discover-workshops-detail--engaged.png` — `/user/discover/workshops/cmp8iwkjx00041327ux4xgpy0`
- `user-library--engaged.png` — `/user/library`
- `user-shop--engaged.png` — `/user/shop`
- `user-shop-detail--engaged.png` — `/user/shop/cmmk306a0000ftb3es7otzjgn`
- `user-cart-with-item--engaged.png` — `/user/cart`
- `user-orders--engaged.png` — `/user/orders`
- `user-orders-detail--engaged.png` — `/user/orders/cmp8jjry50001jv27j2brvoai` _[HTTP 404]_
- `user-profile--engaged.png` — `/user/profile`
- `user-notifications--engaged.png` — `/user/notifications`

## Empty-user captures (8)

- `user-home--empty.png` — `/user`
- `user-practice--empty.png` — `/user/practice`
- `user-practice-journal--empty.png` — `/user/practice/journal`
- `user-practice-assignments--empty.png` — `/user/practice/assignments`
- `user-library--empty.png` — `/user/library`
- `user-orders--empty.png` — `/user/orders`
- `user-cart--empty.png` — `/user/cart`
- `user-discover-workshops--empty.png` — `/user/discover/workshops`

## Non-200 statuses (2)

These routes loaded but returned a non-200 HTTP status. The screenshot captured whatever the browser rendered (typically a 404 page).

- `/user/practice/mindfulness` (engaged) → HTTP 404 → `user-practice-mindfulness--engaged.png`
- `/user/orders/cmp8jjry50001jv27j2brvoai` (engaged) → HTTP 404 → `user-orders-detail--engaged.png`
