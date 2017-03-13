'use strict';

const /* PRESET_BOX = document.getElementById('preset_fieldset'),
	GENERATION_SELECTOR = document.getElementById('generation_selector'), */

	QUESTION_BOX = document.getElementById('question_fieldset'),
	TARGET_VALUES = getInputFieldsByType(QUESTION_BOX, 'radio'),
	DEFAULT_TARGET_ID = 'transmitter_power',
	DEFAULT_TARGET = document.getElementById(DEFAULT_TARGET_ID),

	PARAMETERS_BOX = document.getElementById('parameters_fieldset'),
	PARAMETERS_FIELDS = getInputFieldsByType(PARAMETERS_BOX, 'number'),

	FIELD_DISABLED_BY_DEFAULT = document.getElementsByName(DEFAULT_TARGET_ID)[0],
	UNIT_SELECTORS = document.getElementsByClassName('unit_selector'),
	WATT_UNIT = 'Вт', DB_UNIT = 'дБ', DBM_UNIT = 'дБм',

	CLEAR_BUTTON = document.getElementsByName('reset_button')[0],
	EXECUTE_BUTTON = document.getElementsByName('calculate_button')[0],

	ALLOWED_PARAMETER_TEMPLATE = new RegExp('^-?[0-9]+[\\.,]?[0-9]*$'),
	WRONG_NUMBER_CLASS_NAME = 'wrong_number_format',

	FORMULAS = {
		'transmitter_power' : function() {
			return -1 * (CONNECTION.transmitter_gain + 10 * log10(CONNECTION.transmitter_loss) - CONNECTION.reciever_power 
				+ CONNECTION.reciever_gain + 10 * log10(CONNECTION.reciever_loss) + 20 * log10(300 / CONNECTION.main_frequency) 
				- 20 * log10(CONNECTION.max_range * 1000) - 20 * log10(4 * Math.PI));
		},
		'transmitter_loss' : function() {
			return Math.pow(10, -0.1 * (CONNECTION.transmitter_power + CONNECTION.transmitter_gain 
				- CONNECTION.reciever_power + CONNECTION.reciever_gain + 10 * log10(CONNECTION.reciever_loss)
				+ 20 * log10(300 / CONNECTION.main_frequency) - 20 * log10(CONNECTION.max_range * 1000) - 20 * log10(4 * Math.PI)));
		},
		'transmitter_gain' : function() {
			return -1 * (CONNECTION.transmitter_power + 10 * log10(CONNECTION.transmitter_loss) - CONNECTION.reciever_power 
				+ CONNECTION.reciever_gain + 10 * log10(CONNECTION.reciever_loss) + 20 * log10(300 / CONNECTION.main_frequency) 
				- 20 * log10(CONNECTION.max_range * 1000) - 20 * log10(4 * Math.PI));
		},
		'main_frequency' : function() {
			return 300 / Math.pow(10, -0.05 * (CONNECTION.transmitter_power + CONNECTION.transmitter_gain + 10 * log10(CONNECTION.transmitter_loss) 
				- CONNECTION.reciever_power + CONNECTION.reciever_gain + 10 * log10(CONNECTION.reciever_loss) 
				- 20 * log10(CONNECTION.max_range * 1000) - 20 * log10(4 * Math.PI)));
		},
		'reciever_power' : function() {
			return CONNECTION.transmitter_power + CONNECTION.transmitter_gain + 10 * log10(CONNECTION.transmitter_loss) 
				+ CONNECTION.reciever_gain + 10 * log10(CONNECTION.reciever_loss) + 20 * log10(300 / CONNECTION.main_frequency) 
				- 20 * log10(CONNECTION.max_range * 1000) - 20 * log10(4 * Math.PI);
		},
		'reciever_loss' : function() {
			return Math.pow(10, -0.1 * (CONNECTION.transmitter_power + CONNECTION.transmitter_gain 
				+ 10 * log10(CONNECTION.transmitter_loss) - CONNECTION.reciever_power + CONNECTION.reciever_gain 
				+ 20 * log10(300 / CONNECTION.main_frequency) - 20 * log10(CONNECTION.max_range * 1000) - 20 * log10(4 * Math.PI)));
		},
		'reciever_gain' : function() {
			return -1 * (CONNECTION.transmitter_power + CONNECTION.transmitter_gain + 10 * log10(CONNECTION.transmitter_loss) 
				- CONNECTION.reciever_power + 10 * log10(CONNECTION.reciever_loss) + 20 * log10(300 / CONNECTION.main_frequency) 
				- 20 * log10(CONNECTION.max_range * 1000) - 20 * log10(4 * Math.PI));
		},
		'max_range' : function() {
			return Math.pow(10, 0.05 * (CONNECTION.transmitter_power + CONNECTION.transmitter_gain 
				+ 10 * log10(CONNECTION.transmitter_loss) - CONNECTION.reciever_power + CONNECTION.reciever_gain 
				+ 10 * log10(CONNECTION.reciever_loss) + 20 * log10(300 / CONNECTION.main_frequency) - 20 * log10(4 * Math.PI))) / 1000;
		}
	};

let WRONG_FILLED_FIELDS = document.getElementsByClassName(WRONG_NUMBER_CLASS_NAME),
	CURRENT_DISABLED_FIELD = FIELD_DISABLED_BY_DEFAULT,
	CONNECTION = {
		result_parameter : CURRENT_DISABLED_FIELD,
		transmitter_unit : WATT_UNIT,
		reciever_unit : WATT_UNIT
	}

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
		// console.log('Setted resut_parameter to ' + CONNECTION.result_parameter.name);
	});
});

convertToArray(PARAMETERS_FIELDS).forEach(function(currentField) {
	currentField.addEventListener('blur', function() {
		if (validateNumberField(this))
			setSimpleConnectionParameter(this);
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
		// console.log('Calculation started');
		convertPowerValuesBeforeCalculation();
		let finalResult = convertPowerVariableAfterCalculation(+FORMULAS[CONNECTION.result_parameter.name]()).toFixed(2);
		CONNECTION[CONNECTION.result_parameter.name] = CONNECTION.result_parameter.value = finalResult;
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

function setSimpleConnectionParameter(currentField) {
	let currentFieldName = currentField.name;
	CONNECTION[currentFieldName] = (currentField.getAttribute('type') == 'number') ? +getValueAsNumber(currentField) : currentField.value;
	// console.log('Setted ' + currentFieldName + ' to ' + CONNECTION[currentFieldName]);
}

function validateNumberField(field) {
	let validationPassed = field.disabled || getValueAsNumber(field).length != 0 && ALLOWED_PARAMETER_TEMPLATE.test(getValueAsNumber(field));
	if (!validationPassed) {
		field.classList.add(WRONG_NUMBER_CLASS_NAME);
	}
	return validationPassed;
}

function getValueAsNumber(field) {
	return (!isNaN(field.valueAsNumber)) ? field.valueAsNumber : field.value.replace(/,/, '.');
}

// Should be refactored ASAP, such a shame
function convertPowerValuesBeforeCalculation() {
	if (CONNECTION.result_parameter.name != 'transmitter_power') {
		switch (CONNECTION.transmitter_unit) {
			case WATT_UNIT : {
				CONNECTION.transmitter_power = convertToDBMFromWatts(CONNECTION.transmitter_power);
				// console.log('Converted transmitter_power unit from Watts to dBm: ' + CONNECTION.transmitter_power);
				break;
			}
			case DB_UNIT : {
				CONNECTION.transmitter_power = convertToDBMFromDB(CONNECTION.transmitter_power);
				// console.log('Converted transmitter_power unit from dB to dBm: ' + CONNECTION.transmitter_power);
				break;
			}
		}
	}
	if (CONNECTION.result_parameter.name != 'reciever_power') {
		switch (CONNECTION.reciever_unit) {
			case WATT_UNIT : {
				// console.log(convertToDBMFromWatts(CONNECTION.reciever_power));
				CONNECTION.reciever_power = convertToDBMFromWatts(CONNECTION.reciever_power);
				// console.log('Converted reciever_power unit from Watts to dBm: ' + CONNECTION.reciever_power);
				break;
			}
			case DB_UNIT : {
				CONNECTION.reciever_power = convertToDBMFromDB(CONNECTION.reciever_power);
				// console.log('Converted reciever_power unit from dB to dBm: ' + CONNECTION.reciever_power);
				break;
			}
		}
	} 
}

function convertPowerVariableAfterCalculation(preCalculatedResult) {
	// console.log('Before conversion: ' + preCalculatedResult);
	if (CONNECTION.result_parameter.name == 'transmitter_power') {
		switch (CONNECTION.transmitter_unit) {
			case WATT_UNIT : {
				preCalculatedResult = convertToWattsFromDBM(preCalculatedResult);
				// console.log('Converted transmitter_power unit from dBm to Watts: ' + preCalculatedResult);
				break;
			}
			case DB_UNIT : {
				preCalculatedResult = convertToDBFromDBM(preCalculatedResult);
				// console.log('Converted transmitter_power unit from dBm to dB: ' + preCalculatedResult);
				break;
			}
		}
	} else if (CONNECTION.result_parameter.name == 'reciever_power') {
		switch (CONNECTION.reciever_unit) {
			case WATT_UNIT : {
				preCalculatedResult = convertToWattsFromDBM(preCalculatedResult);
				// console.log('Converted reciever_power unit from dBm to Watts: ' + preCalculatedResult);
				break;
			}
			case DB_UNIT : {
				preCalculatedResult = convertToDBFromDBM(preCalculatedResult);
				// console.log('Converted reciever_power unit from dBm to dB: ' + preCalculatedResult);
				break;
			}
		}
	}
	// console.log('Converted: ' + preCalculatedResult);
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