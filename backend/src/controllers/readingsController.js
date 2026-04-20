import ControllerBase from "./controllerBase.js";
import readingsService from "../services/readingsService.js";

class ReadingsController extends ControllerBase {
    service = readingsService;
    entityName = "Reading";

    /**
     * @param {import("express").Request} req - Express request
     * @param {import("express").Response} res - Express response
     * @param {import("express").NextFunction} next - Next function
     */
    async create(req, res, next) {
        const schema = {
            type: "object",
            properties: {
                id: { type: "string" },
                readings: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            sensorType: { type: "string" },
                            value: { type: "number" }
                        },
                        required: ["sensor_type", "value"],
                        additionalProperties: false
                    },
                    minItems: 1
                }
            },
            required: ["id", "readings"],
            additionalProperties: false
        };

        try {
            const validationResult = this.validate(schema, req.body);
            if (!validationResult.success) {
                return next(validationResult.errorDetails);
            }

            //TO DO: Implement token authentication for devices sending readings

            const createdReadings = await this.service.create(req.body.id, req.body.readings);
            return res.status(201).json(createdReadings);
        } catch (error) {
            return next(error);
        }
    }
}

export default ReadingsController;
