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
import { View } from "react-native";
import { SliderProps } from "react-native-elements";

type Props = SliderProps & {
  thumbRound?: boolean;
};
export default class CustomSlider extends Component<Props> {
  render() {
    const {
      disabled,
      maximumValue,
      minimumValue,
      step,
      style,
      thumbTintColor = "#9991ff",
      value,
      onValueChange,
      thumbRound = false
    } = this.props;

    return (
      <View style={style}>
        <style>{`
          .slider {
            padding: 0;
            flex: 1;
            min-width: 0;
            outline: none;
            border-color: transparent;
            background-color: transparent;

            -webkit-appearance: none;
          }
          .slider:focus {
            outline: none;
          }
          .slider::-webkit-slider-runnable-track {
            height: 1px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.2);
            cursor: pointer;
          }
          .slider::-webkit-slider-thumb {
            position: relative;
            top: -8px;
            width: 8px;
            height: 16px;
            background: ${thumbTintColor};
            cursor: pointer;

            -webkit-appearance: none;
          }

          .slider.slider-round::-webkit-slider-thumb {
            width: 16px;
            border-radius: 16px;
          }
        `}</style>
        <input
          type="range"
          className={thumbRound ? "slider slider-round" : "slider"}
          disabled={disabled}
          max={maximumValue}
          min={minimumValue}
          step={step}
          value={value}
          onChange={({ currentTarget }) => {
            if (onValueChange) {
              const { value } = currentTarget;
              onValueChange(parseFloat(value));
            }
          }}
        />
      </View>
    );
  }
}
