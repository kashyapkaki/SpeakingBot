var synth = window.speechSynthesis;

//var inputForm = document.querySelector('form');
var inputTxt = document.querySelector('.txt');
var voiceSelect = document.querySelector('select');

var pitch = document.querySelector('#pitch');
var pitchValue = document.querySelector('.pitch-value');
var rate = document.querySelector('#rate');
var rateValue = document.querySelector('.rate-value');
var play = document.getElementById('play');
var pause = document.getElementById('pause');
var resume = document.getElementById('resume');
var stop = document.getElementById('stop');
var file = document.getElementById("file");

enableAndDisable(true);
play.disabled = false;

play.addEventListener('click',function(event){
	event.preventDefault();
	
  speak();

  inputTxt.blur();
});

pause.addEventListener('click', ()=>{synth.pause()});
resume.addEventListener('click', ()=>{synth.resume()});
stop.addEventListener('click', ()=>{synth.cancel()});

pitch.onchange = function() {
  pitchValue.textContent = pitch.value;
}

rate.onchange = function() {
  rateValue.textContent = rate.value;
}

voiceSelect.onchange = function(){
  speak();
}

var voices = [];
populateVoiceList();

function populateVoiceList() {
  voices = synth.getVoices();
  var selectedIndex = voiceSelect.selectedIndex < 0 ? 0 : voiceSelect.selectedIndex;
  voiceSelect.innerHTML = '';
  for(i = 0; i < voices.length ; i++) {
    var option = document.createElement('option');
    option.textContent = voices[i].name + ' (' + voices[i].lang + ')';
    
    if(voices[i].default) {
      option.textContent += ' -- DEFAULT';
    }

    option.setAttribute('data-lang', voices[i].lang);
    option.setAttribute('data-name', voices[i].name);
    voiceSelect.appendChild(option);
  }
  voiceSelect.selectedIndex = selectedIndex;
}


if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoiceList;
}

function speak(){
    if (synth.speaking) {
        console.error('speechSynthesis.speaking');
        return;
    }
    if (inputTxt.value !== '') {
    var utterThis = new SpeechSynthesisUtterance(inputTxt.value);
    utterThis.onend = function (event) {
		enableAndDisable(true);
        console.log('SpeechSynthesisUtterance.onend');
    }
    utterThis.onerror = function (event) {
		alert('Oops! Something went wrong. Please refresh the page and try again.');
        console.error('SpeechSynthesisUtterance.onerror');
    }
    var selectedOption = voiceSelect.selectedOptions[0].getAttribute('data-name');
	utterThis.voice = voices.filter(function(e){ return e.name == voiceSelect.selectedOptions[0].getAttribute('data-name')})[0];
    utterThis.pitch = pitch.value;
    utterThis.rate = rate.value;
    synth.speak(utterThis);
	enableAndDisable(false);
  }
}

function enableAndDisable(flag){
	play.disabled = !flag;
	pause.disabled = flag;
	resume.disabled = flag;
	stop.disabled = flag;
}

file.addEventListener('change', function(evt){
	if(evt.target.files.length > 0){
		var file = evt.target.files[0];

		//Read the file using file reader
		var fileReader = new FileReader();

		fileReader.onload = function () {

			//Turn array buffer into typed array
			var typedarray = new Uint8Array(this.result);

			//calling function to read from pdf file
			getText(typedarray).then(function (text) {
				/*Selected pdf file content is in the variable text. */
				// document.getElementById("content").textContent = text;
				inputTxt.value = text;
			}, function (reason) //Execute only when there is some error while reading pdf file
			{
				alert('Seems this file is broken, please upload another file');
				console.error(reason);
			});

			//getText() function definition. This is the pdf reader function.
			function getText(typedarray) {

				//PDFJS should be able to read this typedarray content

				var pdf = PDFJS.getDocument(typedarray);
				return pdf.then(function (pdf) {

					// get all pages text
					var maxPages = pdf.pdfInfo.numPages;
					var countPromises = [];
					// collecting all page promises
					for (var j = 1; j <= maxPages; j++) {
						var page = pdf.getPage(j);

						var txt = "";
						countPromises.push(page.then(function (page) {
							// add page promise
							var textContent = page.getTextContent();

							return textContent.then(function (text) {
								// return content promise
								return text.items.map(function (s) {
									return s.str;
								}).join(''); // value page text
							});
						}));
					}

					// Wait for all pages and join text
					return Promise.all(countPromises).then(function (texts) {
						return texts.join('');
					});
				});
			}
		};
		
		//Read the file as ArrayBuffer
		fileReader.readAsArrayBuffer(file);		
	}
});

