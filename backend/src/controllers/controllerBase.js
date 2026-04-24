import Ajv from "ajv";

class ControllerBase {
    service = null;
    entityName = "";
    /**
     * @private
     */
    ajv = new Ajv();

    notFoundError(entityName = this.entityName) {
        return {
            message: `${entityName} not found`,
            details: `Could not find ${entityName.toLowerCase()} in database`,
            status: 404
        };
    }

    invalidTimestampError() {
        return {
            message: "Invalid timestamp",
            details: "The given timestamp is not a valid time",
            status: 400
        };
    }

    /**
     * 
     * @param {Date} date - The date to validate
     * @returns {boolean} True if the date is valid, false if it is invalid.
     */
    validateDate(date) {
        return !isNaN(date.getTime()) && date.getTime() > 0 && isFinite(date.getTime());
    }

    validate(schema, data) {
        const result = {
            success: true,
            errorDetails: {}
        };
        if (!this.ajv.validate(schema, data)) {
            result.success = false;
            result.errorDetails = {
                message: "Validation error",
                details: this.ajv.errors,
                status: 400
            }
            return result;
        }
        return result;
    }
}

export default ControllerBase;