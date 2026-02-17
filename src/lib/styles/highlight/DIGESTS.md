## Subresource Integrity

If you are loading Highlight.js via CDN you may wish to use [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) to guarantee that you are using a legimitate build of the library.

To do this you simply need to add the `integrity` attribute for each JavaScript file you download via CDN. These digests are used by the browser to confirm the files downloaded have not been modified.

```html
<script
  src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js"
  integrity="sha384-5xdYoZ0Lt6Jw8GFfRP91J0jaOVUq7DGI1J5wIyNi0D+eHVdfUwHR4gW6kPsw489E"></script>
<!-- including any other grammars you might need to load -->
<script
  src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/go.min.js"
  integrity="sha384-HdearVH8cyfzwBIQOjL/6dSEmZxQ5rJRezN7spps8E7iu+R6utS8c2ab0AgBNFfH"></script>
```

The full list of digests for every file can be found below.

### Digests

```
sha384-438VvREiNgglTDpNRSy9a7XNruw6H3AnLjjX+9uSmeU0fV4ctLxA185FIHO3dmKA /es/languages/prolog.js
sha384-+4Gum6EgKQF+lIr6Kwgooj3H1iGUPni2Dt1Nw82217y7ukdLBABEKkRebOfh58iO /es/languages/prolog.min.js
sha384-fAof6DkVk+a3QlPV7mC9+D//Z4NSM3AIUqTIieUEsnrfsrF6GDD8GKtbvkLXUohG /languages/prolog.js
sha384-7efWBk7QdAk1TUr3ZC0YEw8aFov67m9G06Ojp0Yga1c2P+s05P7sxKkKIua7QyEO /languages/prolog.min.js
sha384-FyBHo6yu/BZnwzg/nPV3XemBok0b71foqqjDMot7ihQdvawyvQLwIiZtWf2h6h/e /highlight.js
sha384-ji6A1lIEbAG+KP91HF/1geiCQdw4YxbA6RdpmwALJkGuGIvGdMCtbHOvM+S4en/C /highlight.min.js
```

