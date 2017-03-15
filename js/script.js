'use strict';

const /* PRESET_BOX = document.getElementById('preset_fieldset'),
	GENERATION_SELECTOR = document.getElementById('generation_selector'), */

	QUESTION_BOX = document.getElementById('question_fieldset'),
	TARGET_VALUES = getInputFieldsByType(QUESTION_BOX, 'radio'),
	
	DEFAULT_TARGET_ID = 'transmitter_power',
	DEFAULT_TARGET = document.getElementById(DEFAULT_TARGET_ID),
	FIELD_DISABLED_BY_DEFAULT = document.getElementsByName(DEFAULT_TARGET_ID)[0],

	PARAMETERS_BOX = document.getElementById('parameters_fieldset'),
	PARAMETERS_FIELDS = getInputFieldsByType(PARAMETERS_BOX, 'number'),

	UNIT_SELECTORS = document.getElementsByClassName('unit_selector'),
	WATT_UNIT = 'Вт', DB_UNIT = 'дБ', DBM_UNIT = 'дБм',

	CLEAR_BUTTON = document.getElementsByName('reset_button')[0],
	EXECUTE_BUTTON = document.getElementsByName('calculate_button')[0],

	ALLOWED_PARAMETER_TEMPLATE = new RegExp('^-?[0-9]+\\.?[0-9]*$'),
	WRONG_NUMBER_CLASS_NAME = 'wrong_number_format',
	UNIT_POSTFIX = '_unit',

	FORMULAS = {

		'transmitter_power' : function() {
			return -1 * (CONNECTION.transmitter_gain.value + 10 * log10(CONNECTION.transmitter_loss.value) - CONNECTION.reciever_power.value 
				+ CONNECTION.reciever_gain.value + 10 * log10(CONNECTION.reciever_loss.value) + 20 * log10(300 / CONNECTION.main_frequency.value) 
				- 20 * log10(CONNECTION.max_range.value * 1000) - 20 * log10(4 * Math.PI));
		},
		'transmitter_loss' : function() {
			return Math.pow(10, -0.1 * (CONNECTION.transmitter_power.value + CONNECTION.transmitter_gain.value 
				- CONNECTION.reciever_power.value + CONNECTION.reciever_gain.value + 10 * log10(CONNECTION.reciever_loss.value)
				+ 20 * log10(300 / CONNECTION.main_frequency.value) - 20 * log10(CONNECTION.max_range.value * 1000) - 20 * log10(4 * Math.PI)));
		},
		'transmitter_gain' : function() {
			return -1 * (CONNECTION.transmitter_power.value + 10 * log10(CONNECTION.transmitter_loss.value) - CONNECTION.reciever_power.value 
				+ CONNECTION.reciever_gain.value + 10 * log10(CONNECTION.reciever_loss.value) + 20 * log10(300 / CONNECTION.main_frequency.value) 
				- 20 * log10(CONNECTION.max_range.value * 1000) - 20 * log10(4 * Math.PI));
		},
		'main_frequency' : function() {
			return 300 / Math.pow(10, -0.05 * (CONNECTION.transmitter_power.value + CONNECTION.transmitter_gain.value + 10 * log10(CONNECTION.transmitter_loss.value) 
				- CONNECTION.reciever_power.value + CONNECTION.reciever_gain.value + 10 * log10(CONNECTION.reciever_loss.value) 
				- 20 * log10(CONNECTION.max_range.value * 1000) - 20 * log10(4 * Math.PI)));
		},
		'reciever_power' : function() {
			return CONNECTION.transmitter_power.value + CONNECTION.transmitter_gain.value + 10 * log10(CONNECTION.transmitter_loss.value) 
				+ CONNECTION.reciever_gain.value + 10 * log10(CONNECTION.reciever_loss.value) + 20 * log10(300 / CONNECTION.main_frequency.value) 
				- 20 * log10(CONNECTION.max_range.value * 1000) - 20 * log10(4 * Math.PI);
		},
		'reciever_loss' : function() {
			return Math.pow(10, -0.1 * (CONNECTION.transmitter_power.value + CONNECTION.transmitter_gain.value 
				+ 10 * log10(CONNECTION.transmitter_loss.value) - CONNECTION.reciever_power.value + CONNECTION.reciever_gain.value 
				+ 20 * log10(300 / CONNECTION.main_frequency.value) - 20 * log10(CONNECTION.max_range.value * 1000) - 20 * log10(4 * Math.PI)));
		},
		'reciever_gain' : function() {
			return -1 * (CONNECTION.transmitter_power.value + CONNECTION.transmitter_gain.value + 10 * log10(CONNECTION.transmitter_loss.value) 
				- CONNECTION.reciever_power.value + 10 * log10(CONNECTION.reciever_loss.value) + 20 * log10(300 / CONNECTION.main_frequency.value) 
				- 20 * log10(CONNECTION.max_range.value * 1000) - 20 * log10(4 * Math.PI));
		},
		'max_range' : function() {
			return Math.pow(10, 0.05 * (CONNECTION.transmitter_power.value + CONNECTION.transmitter_gain.value 
				+ 10 * log10(CONNECTION.transmitter_loss.value) - CONNECTION.reciever_power.value + CONNECTION.reciever_gain.value 
				+ 10 * log10(CONNECTION.reciever_loss.value) + 20 * log10(300 / CONNECTION.main_frequency.value) - 20 * log10(4 * Math.PI))) / 1000;
		}
	};

let WRONG_FILLED_FIELDS = document.getElementsByClassName(WRONG_NUMBER_CLASS_NAME),
	CURRENT_DISABLED_FIELD = FIELD_DISABLED_BY_DEFAULT,
	
	CONNECTION = {
		result_parameter : CURRENT_DISABLED_FIELD,
		reciever_power : {
			unit : WATT_UNIT
		},
		transmitter_power : {
			unit : WATT_UNIT
		}
	};

convertToArray(TARGET_VALUES).forEach(function(currentTarget) {
	currentTarget.addEventListener('click', function() {
		if (typeof CURRENT_DISABLED_FIELD != 'undefined') {
			CURRENT_DISABLED_FIELD.removeAttribute('disabled');
		}
		let fieldToDisable = convertToArray(PARAMETERS_FIELDS).filter(function(currentField) {
			return currentField.name == currentTarget.id;
		})[0];
		fieldToDisable.value = null;
		fieldToDisable.classList.remove(WRONG_NUMBER_CLASS_NAME);
		fieldToDisable.setAttribute('disabled', true);
		CURRENT_DISABLED_FIELD = fieldToDisable;
		CONNECTION.result_parameter = CURRENT_DISABLED_FIELD;
		console.log('Setted resut_parameter to ' + CONNECTION.result_parameter.name);
	});
});

convertToArray(PARAMETERS_FIELDS).forEach(function(currentField) {
	currentField.addEventListener('blur', function() {
		if (validateNumberField(this)) {
			console.log('Field value successfully validated');
			setSimpleConnectionParameter(this);
		}
	});
	currentField.addEventListener('focus', function() {
		this.classList.remove(WRONG_NUMBER_CLASS_NAME);
	})
});

convertToArray(UNIT_SELECTORS).forEach(function(currentSelector) {
	currentSelector.addEventListener('blur', function () {
		setSimpleConnectionParameter(this);
	});
});

EXECUTE_BUTTON.addEventListener('click', function() {
	let correctlyFilledFields = convertToArray(PARAMETERS_FIELDS).filter(validateNumberField);
	if (correctlyFilledFields.length != PARAMETERS_FIELDS.length)
		alert('Параметры заполнены некорректно');
	else {
		console.log('Calculation started');
		convertPowerValuesBeforeCalculation();
		let finalResult = Number(FORMULAS[CONNECTION.result_parameter.name]())
		CONNECTION.result_parameter.value = assignValueToObjectProperty([`${CONNECTION.result_parameter.name}`], 'value', convertPowerVariableAfterCalculation(finalResult));
	}
});

CLEAR_BUTTON.addEventListener('click', function() {
	convertToArray(WRONG_FILLED_FIELDS).forEach(function(currentField) {
		 currentField.classList.remove(WRONG_NUMBER_CLASS_NAME);
	});
	DEFAULT_TARGET.click();
});

function getInputFieldsByType(parentNode, fieldType) {
	return parentNode.querySelectorAll('input[type="' + fieldType + '"]');
}

function convertToArray(nodeList) {
	return Array.prototype.slice.call(nodeList);
}

function validateNumberField(field) {
	let validationPassed = field.disabled || ALLOWED_PARAMETER_TEMPLATE.test(field.value);
	if (!validationPassed)
		field.classList.add(WRONG_NUMBER_CLASS_NAME);
	return validationPassed;
}

function setSimpleConnectionParameter(currentField) {
	let currentFieldName = currentField.name;
	let currentParameterValue = (currentField.getAttribute('type') == 'number') ? getValueAsNumber(currentField) : currentField.value;
	if (currentFieldName.indexOf(UNIT_POSTFIX) != -1) {
		let relatedFieldName = getRelatedFieldName(currentField);
		assignValueToObjectProperty(relatedFieldName, 'unit', currentParameterValue);
		console.log('Setted ' + relatedFieldName + ' unit to ' + currentParameterValue);
		return;
	}
	assignValueToObjectProperty(currentFieldName, 'value', currentParameterValue);
	console.log('Setted ' + currentFieldName + ' value to ' + currentParameterValue);
}

function getValueAsNumber(field) {
	return (!isNaN(field.valueAsNumber)) ? field.valueAsNumber : Number(field.value);
}

function getRelatedFieldName(currentSelector) {
	return currentSelector.previousElementSibling.name;
}

function getRelatedUnitName(currentField) {
	return currentField.nextElementSibling.value;
}

function assignValueToObjectProperty(fieldName, parameterName, value) {
	if (CONNECTION.hasOwnProperty(fieldName))
		CONNECTION[fieldName][`${parameterName}`] = value;
	else
		Object.defineProperty(CONNECTION, fieldName, {
			value : {
				[`${parameterName}`] : value
			}
		});
	return value;
}

function convertPowerValuesBeforeCalculation() {
	convertToArray(PARAMETERS_FIELDS).filter(function(currentField) {
		return currentField.name != CONNECTION.result_parameter.name && currentField.name.indexOf('_power') != -1
	}).forEach(function(currentElement) {
		let currentElementName = currentElement.name;
		switch (getRelatedUnitName(currentElement)) {
			case WATT_UNIT: {
				CONNECTION[`${currentElementName}`].value = convertToDBMFromWatts(getValueAsNumber(currentElement));
				console.log('Converted ' + currentElementName + ' unit from Watts to dBm: ' + CONNECTION[`${currentElementName}`].value);
				break;
			}
			case DB_UNIT: {
				CONNECTION[`${currentElementName}`].value = convertToDBMFromDB(getValueAsNumber(currentElement));
				console.log('Converted ' + currentElementName + ' unit from dB to dBm: ' + CONNECTION[`${currentElementName}`].value);
				break;
			}
		}
	});
}

function convertPowerVariableAfterCalculation(preCalculatedResult) {
	convertToArray(PARAMETERS_FIELDS).filter(function(currentField) {
		return currentField.name == CONNECTION.result_parameter.name && currentField.name.indexOf('_power') != -1
	}).forEach(function(currentElement) {
		let currentElementName = currentElement.name;
		switch (getRelatedUnitName(currentElement)) {
			case WATT_UNIT: {
				preCalculatedResult = convertToWattsFromDBM(preCalculatedResult);
				console.log('Converted ' + currentElementName + ' unit from dBm to Watts: ' + preCalculatedResult);
				break;
			}
			case DB_UNIT: {
				preCalculatedResult = convertToDBFromDBM(CONNECTION[`${currentElementName}`].value);
				console.log('Converted ' + currentElementName + ' unit from dBm to DB: ' + preCalculatedResult);
				break;
			}
		}
	});
	return preCalculatedResult;
}

function log10(value) {return Math.log(value) / Math.LN10;}

function convertToDBMFromWatts(powerValue) {
	return 10 * log10(powerValue * 1000);
}

function convertToDBFromWatts(powerValue) {
	return 10 * log10(powerValue);
}

function convertToWattsFromDB(powerValue) {
	return Math.pow(10, 0.1 * powerValue);
}

function convertToWattsFromDBM(powerValue) {
	return convertToWattsFromDB(convertToDBFromDBM(powerValue));
}

function convertToDBFromDBM(powerValue) {
	return powerValue - 30;
}

function convertToDBMFromDB(powerValue) {
	return powerValue + 30;
}
