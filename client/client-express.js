var BaseURL = 'http://127.0.0.1:3000/';
var myTimer, oldText = '';
var dmp = new diff_match_patch();

function init() {

    var userJSON = {
        username: navigator.userAgent
    };

    //Get the old text from the backend, if the user has already saved some text earlier
    $.ajax({
        url: BaseURL + 'getData',
        data: userJSON,
        type: 'POST',
        success: function (data) {
            if (data) {

                //Replacing \n (Escape Character) with a "\n" so we can parse it --This is to handle Escape characters added in the text by user
                data = data.replace(/\n/g, "\\n");

                data = JSON.parse(data);
                $("#text1").val(data.Result);
                oldText = data.Result;
            }
        },
        error: function (error) {
            console.log('Error');
        },
    });
}

function checkText(htmlText) {

    //clear the timer after every new keypress
    clearTimeout(myTimer);

    //check if we have some value in text area and it's not same as old text
    if (htmlText.value && oldText != htmlText.value) {
        myTimer = setTimeout(function () {
            saveText(htmlText.value)
        }, 2000);
    }
}

function saveText(newText) {

    //Calculate difference between old and new text
    var diff = dmp.diff_main(oldText, newText, true);
    if (diff.length > 2) {
        dmp.diff_cleanupSemantic(diff);
    }
    var patch_list = dmp.patch_make(oldText, newText, diff);
    var patch_text = dmp.patch_toText(patch_list);

    var textJSON = {
        username: navigator.userAgent,
        changeslist: patch_text
    };

    //Send the difference's array to the backend
    $.ajax({
        url: BaseURL + 'saveData',
        data: textJSON,
        type: 'POST',
        success: function (data) {
            console.log('Success: ' + data);
            oldText = newText;
        },
        error: function (error) {
            console.log('Error');
        },
    });
}