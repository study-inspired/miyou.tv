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
    .component('moritapoSetting', {
      templateUrl: 'templates/moritapoSetting.html',
      controller: moritapoSettingCtrl,
      bindings: {
        close: '&',
        dismiss: '&'
      }
    });

  function moritapoSettingCtrl(
    CommonService
  ) {
    var $ctrl = this;
    $ctrl.hasToken = false;
    $ctrl.email = '';
    $ctrl.password = '';
    $ctrl.hasAuthError = false;

    $ctrl.$onInit = function () {
      $ctrl.email = CommonService.loadLocalStorage('moritapoEmail');
      $ctrl.password = CommonService.loadLocalStorage('moritapoPassword');
    };

    $ctrl.ok = function () {
      CommonService.saveLocalStorage('moritapoEmail', $ctrl.email || '');
      CommonService.saveLocalStorage('moritapoPassword', $ctrl.password || '');
      $ctrl.close();
    };
    $ctrl.cancel = function () {
      $ctrl.dismiss();
    };
  }
}());
