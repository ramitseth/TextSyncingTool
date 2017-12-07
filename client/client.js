var BaseURL = 'http://127.0.0.1:3000/';
var myTimer, oldText;

function init() {
    $.ajax({
        url: BaseURL + 'getData',
        data: '{"username": "' + navigator.userAgent + '"}',
        type: 'POST',
        success: function (data) {
            if (data) {
                data = JSON.parse(data);
                $("#text1").val(data.Result);
                oldText = data.Result;
            }
        },
        error: function (error) {
            console.log('Error: ' + error.message);
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
        }, 3000);
    }
}

function saveText(newText) {
    $.ajax({
        url: BaseURL + 'saveData',
        data: '{"username": "' + navigator.userAgent + '","text": "' + newText + '"}',
        type: 'POST',
        success: function (data) {
            console.log('Success: ' + data);
            oldText = newText;
        },
        error: function (error) {
            console.log('Error: ' + error.message);
        },
    });
}