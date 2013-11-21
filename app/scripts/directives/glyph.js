'use strict';

angular.module('prototypo.glyphDirective', [])
	.directive('glyph', function() {
		return {
			//priority: 0,
			//template: '<div></div>',
			templateUrl: 'views/glyph.html',
			//replace: true,
			//transclude: false,
			restrict: 'EA',
			//scope: false,
			// FIXME: this controller's logic can probably
			// be implemented using the scope attribute above
			controller: function( $scope, $element, $attrs ) {
				// FIXME: we shouldn't need this check
				if ( !$scope.$parent ) {
					return;
				}

				var processGlyphTrigger = function() {console.log('here');
					// FIXME: we shouldn't need this check
					if ( !$scope.$parent ) {
						return;
					}

					if ( !$scope.$parent.currentFont ) {
						return;
					}

					$scope.processedGlyph = $scope.$parent.currentFont.process( $attrs.glyphCode );
				};

				$attrs.$observe('glyph-code', processGlyphTrigger);
				$scope.$parent.$watch('controlValues', processGlyphTrigger, true);
				$scope.$parent.$watch('currentFontName', processGlyphTrigger, true);

			}
			//link: function( scope, iElement, iAttrs ) {}
		};
	});