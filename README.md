# js-search
This is a simple testing project comparing the performance of three general approaches to search through data completely in JavaScript:

1. Generic Angular-based search filter
2. Fuzzy search via [fuse.js](http://kiro.me/projects/fuse.html)
3. Bloom filter search

Each of these three approaches are intended for different scenarios:

1. Angular filter: comes out-of-the-box with Angular, also returns partial results (so "Berlin" will also find "Berliner Straße") but no fuzzy
2. Fuzzy search: also finds results that are close to the entered search term, great for autocomplete or potential typos
3. Bloom Filter: only finds exact matches, very fast, may run in multiple threads via WebWorker

## Details

With the simple UI the three approaches can be compared directly based on different datasets. You can choose between 1000, 10.000, 100.000, 250.000 or 500.000 potential search results that have been pre-generated. Each dataset contains 10 fields of typical identity data (e.g. city, first name and so on). So at max the application would search through 5.000.000 values.

Of course this amount of data affects the performance. There is a debug field displaying all measured values directly, since the main purpose of this is mainly to compare client-side search performance for the described approaches on different browsers and devices.

You can try it right away at the demo site:

[http://janpetzold.github.io/js-search/](http://janpetzold.github.io/js-search/)

For the source data my [data generator](https://github.com/janpetzold/identity-generator) has been used.

I'm happy for any recommendations on improving the performance - just submit a pull request or open an issue.

## Setup
To get started, just clone the repository and execute

`bower install`

to get all dependencies that are not in the repo. Afterwards just fire up a webserver in the project directory and open the page.

