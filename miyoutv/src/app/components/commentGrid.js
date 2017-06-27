/*!
Copyright 2016 Brazil Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
(function () {
  'use strict';

  angular.module('app')
    .component('commentGrid', {
      templateUrl: 'templates/commentGrid.html',
      controller: CommentGridCtrl,
      bindings: {
        options: '<',
        data: '<',
        channels: '=',
        threads: '='
      }
    });

  function CommentGridCtrl(
    $scope,
    CommonService,
    PlayerService
  ) {
    var $ctrl = this;
    var autoScrolling = false;

    $ctrl.options = {};
    $ctrl.data = [];
    $ctrl.autoScroll = true;
    $ctrl.gridOptions = {
      rowSelection: 'single',
      enableColResize: true,
      enableSorting: true,
      suppressCellSelection: true,
      suppressLoadingOverlay: true,
      suppressNoRowsOverlay: true,
      columnDefs: [{
        colId: 'playTime',
        field: 'playTime',
        headerName: '時間',
        width: 70,
        cellStyle: {
          textAlign: 'right'
        },
        cellRenderer: function (params) {
          var time = CommonService.formatTime(params.value);

          return ['<div title="', time, '">', time, '</div>'].join('');
        }
      }, {
        colId: 'time',
        field: 'time',
        headerName: '時刻',
        width: 90,
        cellStyle: {
          textAlign: 'right'
        },
        cellRenderer: function (params) {
          var time = CommonService.formatDate(params.value, 'A HHHH:mm:ss');

          return ['<div title="', time, '">', time, '</div>'].join('');
        }
      }, {
        colId: 'text',
        field: 'text',
        tooltipField: 'text',
        headerName: 'コメント',
        width: 428
      }, {
        colId: 'name',
        field: 'name',
        tooltipField: 'name',
        headerName: '名前',
        width: 180
      }, {
        colId: 'id',
        field: 'id',
        tooltipField: 'id',
        headerName: 'ID',
        width: 180
      }, {
        colId: 'email',
        field: 'email',
        tooltipField: 'email',
        headerName: 'メール',
        width: 240
      }, {
        colId: 'title',
        field: 'title',
        tooltipField: 'title',
        headerName: 'スレッド',
        width: 240
      }],
      onSortChanged: function () {
        var sortModel = this.api.getSortModel();

        if (
          sortModel.length > 1 ||
          sortModel[0].colId !== 'playTime' ||
          sortModel[0].sort !== 'asc'
        ) {
          $ctrl.autoScroll = false;
        }
      },
      onBodyScroll: function (e) {
        if (e.direction === 'vertical') {
          if (autoScrolling) {
            autoScrolling = false;
          } else {
            $ctrl.autoScroll = false;
          }
        }
      },
      onRowDoubleClicked: function () {
        var selectedtRows = this.api.getSelectedRows();

        if (selectedtRows.length > 0) {
          PlayerService.time(selectedtRows[0].playTime);
        }
      }
    };

    $ctrl.autoScrollChanged = function () {
      if ($ctrl.autoScroll) {
        $ctrl.gridOptions.api.setSortModel([{
          colId: 'playTime',
          sort: 'asc'
        }]);
      }
    };

    $scope.$watch(function () {
      return $ctrl.channels;
    }, function (value) {
      if (angular.isArray(value)) {
        $ctrl.channelCount = value.filter(function (a) {
          return a.enabled;
        }).length;
      }
    }, true);
    $scope.$watch(function () {
      return $ctrl.options.offset;
    }, updateData);
    $scope.$watchCollection(function () {
      return $ctrl.data;
    }, updateData);
    $scope.$watch(function () {
      return $ctrl.threads;
    }, updateData, true);
    $scope.$watch(function () {
      return PlayerService.time();
    }, function (newValue, oldValue) {
      if ($ctrl.autoScroll) {
        $ctrl.gridOptions.api.ensureNodeVisible(function (a) {
          return a.data.playTime >= oldValue;
        });
        autoScrolling = true;
      }
    });

    function updateData() {
      var data = $ctrl.data.filter(function (a) {
        return a.enabled !== false;
      });
      if (angular.isNumber($ctrl.options.offset)) {
        data.forEach(function (a) {
          var comment = a;
          comment.playTime = a.time - $ctrl.options.offset;
        });
      }
      $ctrl.gridOptions.api.setRowData(data);
    }
  }
}());
