import ControllerBase from "./controllerBase.js";
import readingsService from "../services/readingsService.js";
import deviceService from "../services/deviceService.js";

class ReadingsController extends ControllerBase {
    service = readingsService;
    entityName = "Readings";

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
                timestamp: { type: "string" },
                readings: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            sensorType: { type: "string" },
                            value: { type: "number" }
                        },
                        required: ["sensorType", "value"],
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

            const device = await deviceService.get(req.body.id);
            if (!device) {
                return next({
                    message: "Device does not exist",
                    details: `Device with id ${req.body.id} does not have an entry in the database`,
                    status: 400
                })
            }

            //No timestamp defined, default to current server time
            if (!req.body.timestamp) req.body.timestamp = new Date();

            req.body.timestamp = new Date(req.body.timestamp);
            if (!this.validateDate(req.body.timestamp)) {
                return next(this.invalidTimestampError());
            }

            const createdReadings = await this.service.create(req.body.id, req.body.readings, req.body.timestamp);

            deviceService.setLastUpdate(req.body.id, req.body.timestamp);
            return res.status(201).json(createdReadings);
        } catch (error) {
            return next(error);
        }
    }
}

export default ReadingsController;
