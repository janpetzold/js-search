# js-search
This is a simple testing project comparing the performance of three general apporaches to serach in JavaScript:

1. Generic Angular-based search filter
2. Similiarity search via fuse.js
3. Bloom filter search

Each of the three apporaches aims at different scenarios:

1. Angular filter: comes out-of-the-box, also returns partial results
2. Similarity search: also finds results that are close to the entered search term, grat for autocomplete
3. Bloom Filter: only finds exact matches, can be easily parallelized via WebWorker

# Setup
To get started, just clone the repository and execute

`bower install`

to get all dependencies that are not in the repo. Afterwards just fire up a webserver in the project directory and open the page.

With the simple UI these three approaches can be compared directly based on different datasets. You can choose between 1000, 10.000, 100.000, 250.000 or 500.000 potential search results. Of course the amount of data affects the performance dramatically. There is a debug field displaying all measured values directly, so this is mainly intended to compare client-side search performance on different browsers and devices.

You can try it right away at the demo site:

For the source data, the data generator at has been used.