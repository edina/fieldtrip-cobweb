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

define(['records', 'utils', 'file'], function(records, utils, file){

    var addRecordProperties = function(e, annotation){
        var annotations = records.loadEditorsMetadata();
        var editorTitle;
        if(annotation.editorGroup in annotations) {
            editorTitle = annotations[annotation.editorGroup][annotation.type].title;
        }
        else {
            editorTitle = annotation.type;
        }

        annotation.record.properties.id = utils.createUUID();

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
                console.error(error);
            };

            cordova.plugins.COBWEBSensorPlugin.lineOfSight('', addPropertFromCordova, addPropertFromCordovaError);
            cordova.plugins.COBWEBSensorPlugin.deviceInfo('', addPropertFromCordova, addPropertFromCordovaError);
        }

    };

    /**
     * Do some processing on photo that has just been taken. Check if image is
     * blurred.
     * @param e
     * @param image Path to file.
     * blurred.
     */
    var checkImage = function(e, image){
        // threshold Blur threshold.  Any variance below this value is deemed
        var threshold = $('#blur-threshold').attr('value') || 0;
        if(threshold <= 0){
            console.debug("Not checking image");
            return;
        }

        var imgPath = file.getFilePathWithoutProtocol(image);
        console.debug("Check image: " + imgPath + ". threshold: " + threshold);

        var finish = function(){
            $.mobile.loading('hide');
        };

        // popup click handler
        $('#capture-image-check-popup a').on('vclick', function(e){
            if($(event.target).attr('id') === 'capture-image-check-retake'){
                // retake photo
                $(".annotate-image").hide();
                $(".image-chooser").show();
            }

            $('#capture-image-check-popup').popup('close');
        });

        $.mobile.loading('show', {
            text: "Checking Image ...",
            textonly: true,
        });

        // use qa plugin
        cordova.plugins.qa.isBlurred(
            function(blurred){
                $.mobile.loading('hide');
                if(blurred){
                    $('#capture-image-check-popup').popup('open');
                }
            },
            function(){
                console.error("Problem with qa plugin");
                $.mobile.loading('hide');
            },
            [imgPath, threshold]
        );
    };

    /**
     * saves the pos_acc into the record properties
     * -1 is for when marker was moved by user
     * null for when GPS times out
     * @param annotation
     * @param {Boolean} moved
     */
    var updateAccuracy = function(e, annotation, moved){
        if (moved) {
            annotation.record = records.addRecordProperty(annotation.record, "pos_acc", -1);
        }
        else {
            annotation.record = records.addRecordProperty(annotation.record, "pos_acc", annotation.record.geometry.gpsPosition.accuracy);
        }
    };

    $(document).on(records.EVT_EDIT_ANNOTATION, addRecordProperties);
    $(document).on(records.EVT_MOVE_ANNOTATION, updateAccuracy);
    $(document).on(records.EVT_TAKE_PHOTO, checkImage);
});
