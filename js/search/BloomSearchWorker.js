importScripts('../../libs/bloomfilter/bloomfilter.js');  

var originalDataset = [];
var bloomDataset = [];

self.addEventListener('message', handleMessage, false);

// TODO: Change the worker so it constructs the BloomFilter itself and does not get all data passed
function handleMessage(e) {
	if(e.data.type === 'init') {
		// handle initialization
		originalDataset = e.data.originalDataset;

		// De-Serialize dataset
		var startDeserializing = new Date().getTime();
		var bloomDatasetLength = e.data.bloomDataset.length;
		
		for(var i = 0; i < bloomDatasetLength; i++) {
			bloomDataset.push(new BloomFilter(e.data.bloomDataset[i], 6));
		}

		console.log('Deserializing data for worker took ' + (new Date().getTime() - startDeserializing) + 'ms');
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