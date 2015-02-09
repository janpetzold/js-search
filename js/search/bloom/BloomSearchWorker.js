importScripts('../../../libs/bloomfilter/bloomfilter.js');  

var originalDataset = [];
var bloomDataset = [];

self.addEventListener('message', handleMessage, false);

// TODO: Change the worker so it constructs the BloomFilter itself and does not get all data passed
function handleMessage(e) {
	if(e.data.type === 'init') {
		// handle initialization
		originalDataset = e.data.originalDataset;

		var startBloom = new Date().getTime();

		// create Bloom filter for dataset
		var datasetLength = originalDataset.length;

		for(var i = 0; i < datasetLength; i++) {
			var bloom = new BloomFilter(32 * 256, 6);

			bloom.add(originalDataset[i].lastName);
			bloom.add(originalDataset[i].firstName);
			bloom.add(originalDataset[i].street);
			bloom.add(originalDataset[i].zipCode);
			bloom.add(originalDataset[i].city);
			bloom.add(originalDataset[i].stateName);
			bloom.add(originalDataset[i].emailAddress);
			bloom.add(originalDataset[i].phone);
			bloom.add(originalDataset[i].dateOfBirthFormatted);

			bloomDataset.push(bloom);
		}

		console.log('Creating Bloom filters took ' + (new Date().getTime() - startBloom));
	}
	if(e.data.type === 'search') {
		// handle search
		startSearch(e.data.term, e.data.originalData);
	}
}

function startSearch(term, originalData) {
	var result = [];
	
	for(var i = 0; i < bloomDataset.length; i++) {
		if(bloomDataset[i].test(term)) {
			result.push(originalDataset[i]);
		}
	}

	self.postMessage(result);
}