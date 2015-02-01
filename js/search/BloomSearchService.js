angular.module('search').factory('BloomSearchService', function BloomSearchService() {
	return {
		addEventListenersForWorkers: function(workers, resultHandler, errorHandler) {
			for(var i = 0; i < workers.length; i++) {
				workers[i].addEventListener('message', resultHandler, false);
				workers[i].addEventListener('error', errorHandler, false);
			}
		},

		serializeBloomData: function(bloomData) {
			var bloomDataLength = bloomData.length;
			var result = [];

			for(var i = 0; i < bloomDataLength; i++) {
				result.push(Array.prototype.slice.call(bloomData[i].buckets));
			}

			return result;
		},

		sliceData: function(originalDataset, bloomDataset) {
			var datasetLength = originalDataset.length;

			var slizedOriginalDataset = [
				originalDataset.slice(0, datasetLength / 4),
				originalDataset.slice(datasetLength / 4, datasetLength / 2),
				originalDataset.slice(datasetLength / 2, (datasetLength / 4) * 3),
				originalDataset.slice((datasetLength / 4) * 3, datasetLength),
			];

			var slizedBloomDataset = [
				bloomDataset.slice(0, datasetLength / 4),
				bloomDataset.slice(datasetLength / 4, datasetLength / 2),
				bloomDataset.slice(datasetLength / 2, (datasetLength / 4) * 3),
				bloomDataset.slice((datasetLength / 4) * 3, datasetLength),
			];

			return {
				'originalDataset': slizedOriginalDataset,
				'bloomDataset': slizedBloomDataset
			};
		},

		getWebWorkerInitMessage: function(offset, dataset) {
			return {
				'type': 'init',
				'bloomDataset': dataset.bloomDataset[offset],
				'originalDataset': dataset.originalDataset[offset]
			};
		},

		mergeBloomResults: function(data) {
			var result = [];
			for(var i = 0; i < data.length; i++) {
				if(data[i].length > 0) {
					result = result.concat(data[i]);
				}
			}
			return result;
		}
	}
});