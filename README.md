# news-image-20261125

[![make.fun · news-image-20261125](https://make.fun/badge/news-image-20261125.svg)](https://make.fun/bounty/news-image-20261125?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261125)
[![rank](https://make.fun/badge/news-image-20261125/slur-hunter/news-image-20261125/rank.svg)](https://make.fun/bounty/news-image-20261125/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261125)
[![reward](https://make.fun/badge/news-image-20261125/slur-hunter/news-image-20261125/reward.svg)](https://make.fun/bounty/news-image-20261125?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261125)

Sum up Wednesday 25 November 2026's world news in one image: 50 stories across 7 regions.

`main.ts` (Node 22, standard library only) draws the whole front page in code — masthead, six-number strip, region bars summing to 50, 3 hero stories with illustrations, 13 more illustrated stories, a 34-item also-on list, a world map with numbered pins matching every illustrated story, and a date-check box — and writes it to `/output/entry.png` (1024x1024 PNG, deterministic: two runs write the same bytes).

Run it: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`

Every story was verified against a live news source on 25 November 2026 and carries its source beside it.
