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

        function unauthorizedError() {
            return {
                message: "Unauthorized",
                details: "Device not authenticated",
                status: 401
            }
        }

        try {
            if (!req.headers['authorization']) {
                return next(unauthorizedError());
            }

            const token = req.headers['authorization'].split(" ")[1];
            if (token !== process.env.DEVICE_TOKEN) {
                return next(unauthorizedError());
            }

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

            //TO DO: Implement token authentication for devices sending readings

            const createdReadings = await this.service.create(req.body.id, req.body.readings);
            return res.status(201).json(createdReadings);
        } catch (error) {
            return next(error);
        }
    }
}

export default ReadingsController;
