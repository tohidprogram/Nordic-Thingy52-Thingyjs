/*
  Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
  All rights reserved.
  Redistribution and use in source and binary forms, with or without modification,
  are permitted provided that the following conditions are met:
  1. Redistributions of source code must retain the above copyright notice, this
     list of conditions and the following disclaimer.
  2. Redistributions in binary form, except as embedded into a Nordic
     Semiconductor ASA integrated circuit in a product or a software update for
     such product, must reproduce the above copyright notice, this list of
     conditions and the following disclaimer in the documentation and/or other
     materials provided with the distribution.
  3. Neither the name of Nordic Semiconductor ASA nor the names of its
     contributors may be used to endorse or promote products derived from this
     software without specific prior written permission.
  4. This software, with or without modification, must only be used with a
     Nordic Semiconductor ASA integrated circuit.
  5. Any software provided in binary form under this license must not be reverse
     engineered, decompiled, modified and/or disassembled.
  THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
  OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
  DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
  HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
  LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
  OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import FeatureOperations from "./FeatureOperations.js";
import SoundConfigurationService from "./SoundConfigurationService.js";

class SpeakerDataService extends FeatureOperations {
  constructor(device) {
    super(device, "speakerdata");

    // gatt service and characteristic used to communicate with Thingy's sound service
    this.service = {
      uuid: this.device.TSS_UUID,
    };

    this.characteristics = {
      default: {
        uuid: this.device.TSS_SPEAKER_DATA_UUID,
        encoder: this.encodeSpeakerData.bind(this),
      },
      config: {
        uuid: this.device.TSS_CONFIG_UUID,
        decoder: this.decodeSoundConfigurationData.bind(this),
        encoder: this.encodeSoundConfigurationData.bind(this),
      },
    };

    this.soundconfigurationservice = new SoundConfigurationService(this);
  }

  async encodeSpeakerData(data) {
    try {
      const mode = {
        speakerMode: data.mode,
      };

      await this.write(mode, "config");

      if (data.mode === 1) {
        const dataArray = new Uint8Array(5);
        const frequency = data.frequency;
        const duration = data.duration;
        const volume = data.volume;

        dataArray[0] = frequency & 0xff;
        dataArray[1] = (frequency >> 8) & 0xff;
        dataArray[2] = duration & 0xff;
        dataArray[3] = (duration >> 8) & 0xff;
        dataArray[4] = volume & 0xff;

        return dataArray;
      } else if (data.mode === 2) {
        console.log("not implemented yet, sorry :(");
      } else if (data.mode === 3) {
        const dataArray = new Uint8Array(1);
        const sample = data.sample;

        dataArray[0] = sample & 0xff;

        return dataArray;
      }
    } catch (error) {
      throw error;
    }
  }

  decodeSoundConfigurationData(data) {
    try {
      const speakerMode = data.getUint8(0);
      const microphoneMode = data.getUint8(1);
      const decodedSoundConfiguration = {
        speakerMode: speakerMode,
        microphoneMode: microphoneMode,
      };
      return decodedSoundConfiguration;
    } catch (error) {
      throw error;
    }
  }

  async encodeSoundConfigurationData(data) {
    try {
      if (typeof data !== "object") {
        return Promise.reject(new TypeError("The argument has to be an object."));
      }

      if ((data.speakerMode === undefined) && (data.microphoneMode === undefined)) {
        return Promise.reject(new TypeError("The argument has to be an object with at least one of the properties speakerMode and microphoneMode."));
      }

      let speakerMode = data.speakerMode;
      let microphoneMode = data.microphoneMode;

      if (speakerMode !== undefined) {
        if (!(speakerMode === 1 || speakerMode === 2 || speakerMode === 3)) {
          return Promise.reject(new RangeError("The speaker mode must be one of the integers 1, 2 or 3."));
        }
      }

      if (microphoneMode !== undefined) {
        if (!(microphoneMode === 1 || microphoneMode === 2)) {
          return Promise.reject(new RangeError("The microphone mode must be one of the integers 1 or 2."));
        }
      }

      const receivedData = await this._read("config", true);
      speakerMode = speakerMode || receivedData.getUint8(0);
      microphoneMode = microphoneMode || receivedData.getUint8(1);

      const dataArray = new Uint8Array(2);
      for (let i = 0; i < dataArray.length; i++) {
        dataArray[i] = receivedData.getUint8(i);
      }

      dataArray[0] = speakerMode & 0xff;
      dataArray[1] = microphoneMode & 0xff;

      return dataArray;
    } catch (error) {
      throw error;
    }
  }
}

export default SpeakerDataService;
