/*
Copyright (c) 2014, EDINA.
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this
   list of conditions and the following disclaimer in the documentation and/or
   other materials provided with the distribution.
3. All advertising materials mentioning features or use of this software must
   display the following acknowledgement: This product includes software
   developed by the EDINA.
4. Neither the name of the EDINA nor the names of its contributors may be used to
   endorse or promote products derived from this software without specific prior
   written permission.

THIS SOFTWARE IS PROVIDED BY EDINA ''AS IS'' AND ANY EXPRESS OR IMPLIED
WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
SHALL EDINA BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
DAMAGE.
*/

"use strict";
/* global cordova */

define(['records', 'utils'], function(records, utils){

    var addRecordProperties = function(e, annotation){
        var annotations = records.loadEditorsMetadata();
        var editorTitle = annotations[annotation.editorGroup][annotation.type].title;

        console.log("record properties added");
        console.log(annotation);
        annotation.record.properties.id = utils.createUUID();
        console.log(annotation.record.properties.id);

        console.log(records.loadEditorsMetadata());
        //TO-DO, investigate of how to add some of these through cordova plugin
        //How about the camera ones?
        annotation.record = records.addRecordProperty(annotation.record, 'title', editorTitle);
        annotation.record = records.addRecordProperty(annotation.record, "pos_sat", "");
        annotation.record = records.addRecordProperty(annotation.record, "pos_acc", null);
        annotation.record = records.addRecordProperty(annotation.record, "pos_tech", "");
        annotation.record = records.addRecordProperty(annotation.record, "dev_os", "");
        var viewAngle = sessionStorage.getItem("cameraViewAngle");
        if(viewAngle !== null){
            viewAngle = JSON.parse(viewAngle);
            annotation.record = records.addRecordProperty(annotation.record, "cam_hoz", viewAngle.Horizontal);
            annotation.record = records.addRecordProperty(annotation.record, "cam_vert", viewAngle.Vertical);
            sessionStorage.removeItem("cameraViewAngle");
        }
        else{
            annotation.record = records.addRecordProperty(annotation.record, "cam_hoz", "");
            annotation.record = records.addRecordProperty(annotation.record, "cam_vert", "");
        }
        annotation.record = records.addRecordProperty(annotation.record, "comp_bar", "");
        annotation.record = records.addRecordProperty(annotation.record, "temp", "");
        annotation.record = records.addRecordProperty(annotation.record, "press", "");
        if(cordova && cordova.plugins && cordova.plugins.COBWEBSensorPlugin){
            var addPropertFromCordova = function(result){
                for(var key in result){
                    annotation.record = records.addRecordProperty(annotation.record, key, result[key]);
                }
            };

            var addPropertFromCordovaError = function(error){
                console.log(error);
            };

            cordova.plugins.COBWEBSensorPlugin.lineOfSight('', addPropertFromCordova, addPropertFromCordovaError);
            cordova.plugins.COBWEBSensorPlugin.deviceInfo('', addPropertFromCordova, addPropertFromCordovaError);
        }

    };

    var updateAccuracy = function(e, annotation){
        annotation.record = records.addRecordProperty(annotation.record, "pos_acc", -1);
    };

    $(document).on(records.EVT_EDIT_ANNOTATION, addRecordProperties);
    $(document).on(records.EVT_MOVE_ANNOTATION, updateAccuracy);

});