# IndexNow

Google is pull-only (sitemap + crawl). **Bing, Yandex, Seznam and Naver accept a push** via
IndexNow, which turns "wait to be crawled" into "tell them now". Bing's index also feeds
ChatGPT search, which is why it is worth the five minutes.

- Key file: `c48b3079949707e140f13bda2044e145.txt` at the site root, containing the key and nothing else.
- Endpoint: `https://api.indexnow.org/indexnow`
- Submit the whole sitemap after a deploy that changes content:

```bash
node submit-indexnow.mjs
```

The key file must stay published — the API re-checks it on every submission and rejects the
batch if it 404s. Do not delete it.
