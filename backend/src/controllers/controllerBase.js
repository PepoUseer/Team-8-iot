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

    validate(schema, data) {
        const result = {
            success: true,
            errorDetails: {}
        };
        if (!this.ajv.validate(schema, data)) {
            result.success = false;
            result.errorDetails = this.ajv.errors;
            return result;
        }
        return result;
    }
}

export default ControllerBase;