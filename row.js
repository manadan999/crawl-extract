c.controller("Row", ["$scope", "safeApply", "ioquery",
	function($scope, safeApply, ioquery) {

	// Whether the row is currently reloading
	$scope.reloading = false;

	// Whether there is an error on this row
	$scope.error = false;

	// Whether this row has ever been reloaded
	$scope.reloaded = false;

	// This is what gets called when you click the reload button on each row
	$scope.reload = function() {
		// Update the state
		$scope.reloading = true;
		$scope.error = false;

		// Issue the query to get the updated data
		ioquery.query({
			"input": {
				"webpage/url": $scope.row.pageUrl
			},
			"connectorGuids": [$scope.sourceGuid]
		}).done(function(data) {
			$scope.reloading = false;
			$scope.error = false;
			$scope.row.results = [];
			data.map(function(row) {
				$scope.row.results.push(row.data);
			});
			$scope.reloaded = true;
			safeApply($scope);
		}).fail(function() {
			$scope.reloading = false;
			$scope.error = true;
			safeApply($scope);
		});
	}

}]);