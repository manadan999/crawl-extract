c.controller("Page", ["$scope", "safeApply", "ioconfig", "ioquery", "ioapi",
	function($scope, safeApply, ioconfig, ioquery, ioapi) {

	// Model values for the form
	$scope.userGuid = "";
	$scope.apiKey = "";
	$scope.sourceGuid = "17331a7f-64d1-42ac-9ff3-0e98ff664056";
	$scope.formLoading = false;

	// Bit of config, how many maximum rows to show in the table
	$scope.maxRows = 250;

	// Whether to enable the form for submission
	$scope.formSubmitEnabled = function() {
		var guidRegex = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;
		return !$scope.formLoading && $scope.userGuid.length && $scope.apiKey.length && $scope.sourceGuid.length && $scope.userGuid.match(guidRegex) && $scope.sourceGuid.match(guidRegex);
	}

	// This is the array that contains the data from the crawl / extractions
	$scope.data = [];

	// We also have to store the output columns for each source, which go as a map of GUID => schema here
	$scope.schemas = {};

	// Gets the data when the form is submitted
	$scope.getData = function() {
		// First set the loading flag for the form
		$scope.formLoading = true;

		// Reset the variables for the rest of the state
		$scope.data = [];
		$scope.schemas = {};

		// Configure the import.io client library with the provided credentials
		ioconfig.init({
			"auth": {
				"userGuid": $scope.userGuid,
				"apiKey": $scope.apiKey
			}
		});

		// Setup a simple fail handler to deal with any issues we may have
		var fail = function(text) {
			alert(text);
			$scope.formLoading = false;
			safeApply($scope);
		}

		// Download the data source from import.io
		ioapi.bucket("connector").object($scope.sourceGuid).get().done(function(source) {
			if (source.type != "CRAWLED_WEB") {
				return fail("Please make sure you use the GUID for a crawler");
			}
			if (source.status != "WORKING") {
				return fail("Your crawler is not currently working, please fix it or choose another one");
			}

			// Next, download the snapshot data from the crawler. This is the last crawl's output
			ioapi.bucket("connector").object($scope.sourceGuid).plugin("attachment", "GET", { "object": "snapshot/" + source.snapshot }).done(function(data) {
				// Pick out the bits of the data we need and put them in the model
				$scope.data = data.tiles[0].results[0].pages;
				if ($scope.data.length > 500) {
					$scope.data = $scope.data.slice(0, $scope.maxRows);
				}
				$scope.schemas = data.tiles[0].schemas;
				// Reset the loading state of the form
				$scope.formLoading = false;
				// This is async so we need to trigger angular to update the UI
				safeApply($scope);
			}).fail(function() {
				fail("Unable to load the snapshot data from the crawler, did you manage to upload a set of crawl data to import.io?");
			});
		}).fail(function() {
			fail("Unable to load data source. Please check your User GUID, API key, and data source GUID");
		});
	}

}]);