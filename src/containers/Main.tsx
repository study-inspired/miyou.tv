/*!
Copyright 2016-2019 Brazil Ltd.
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

import React, { Component } from "react";
import { StyleSheet } from "react-native";
import { MenuProvider } from "react-native-popup-menu";
import SafeAreaView from "react-native-safe-area-view";

import AppNavigator from "../navigators";

export default class Main extends Component {
  render() {
    return (
      <MenuProvider backHandler>
        <SafeAreaView style={styles.container}>
          <AppNavigator />
        </SafeAreaView>
      </MenuProvider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});