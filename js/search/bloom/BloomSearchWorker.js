importScripts('../../../libs/bloomfilter/bloomfilter.js');  

var originalDataset = [];
var bloomDataset = [];

self.addEventListener('message', handleMessage, false);

function handleMessage(e) {
	if(e.data.type === 'init') {
		// handle initialization
		originalDataset = e.data.originalDataset;

		var startBloom = new Date().getTime();

		// create Bloom filter for dataset
		var datasetLength = originalDataset.length;
		console.log(datasetLength);

		// determine bit size for BloomFilter - 2% error tolerance are generally fine
		var bits = datasetLength * 8;

		// be far more restrictive for bigger result sets - works pretty well
		// WebWorkers seem to have much stricter memory limitations, we need to take this into consideration
		if(datasetLength > 24999) {
			bits = Math.ceil(datasetLength / 25);
			console.log(bits);
		}

		for(var i = 0; i < datasetLength; i++) {
			var bloom = new BloomFilter(bits, 6);

			bloom.add(originalDataset[i].lastName);
			bloom.add(originalDataset[i].firstName);
			bloom.add(originalDataset[i].street);
			bloom.add(originalDataset[i].zip);
			bloom.add(originalDataset[i].city);
			bloom.add(originalDataset[i].stateName);
			bloom.add(originalDataset[i].email);
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

function startSearch(term) {
	var result = [];
	
	for(var i = 0; i < bloomDataset.length; i++) {
		if(bloomDataset[i].test(term)) {
			result.push(originalDataset[i]);
		}
	}

	self.postMessage(result);
}