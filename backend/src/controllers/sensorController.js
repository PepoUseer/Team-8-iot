import ControllerBase from "./controllerBase.js";
import sensorService from "../services/sensorService.js";
import sensorDefaults from "../config/sensorDefaults.json" with { type: "json" };


class SensorController extends ControllerBase {
    service = sensorService;
    entityName = "Sensor";
    /**
     * @param {import("express").Request} req - Express request
     * @param {import("express").Response} res - Express response
     * @param {import("express").NextFunction} next - Next function
     */
    async get(req, res, next) {
        const schema = {
            type: "object",
            properties: {
                id: { type: "string" }
            },
            required: ["id"],
            additionalProperties: false
        };
        try {
            const validationResult = this.validate(schema, req.params);
            if (!validationResult.success) {
                return next(validationResult.errorDetails);
            }

            const sensor = await this.service.get(req.params.id);
            if (!sensor) {
                return next(this.notFoundError());
            }

            return res.status(200).json(sensor);
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @param {import("express").Request} req - Express request
     * @param {import("express").Response} res - Express response
     * @param {import("express").NextFunction} next - Next function
     */
    async create(req, res, next) {
        const schema = {
            type: "object",
            properties: {
                deviceId: { type: "string" },
                sensorType: { type: "string" },
                unit: { type: "string" },
                thresholdMin: { type: "number" },
                thresholdMax: { type: "number" }
            },
            required: ["deviceId", "sensorType", "unit"],
            additionalProperties: false
        };
        try {
            const validationResult = this.validate(schema, req.body);
            if (!validationResult.success) {
                return next(validationResult.errorDetails);
            }
            const defaults = sensorDefaults[req.body.sensorType];

            const sensor = await this.service.create(
                req.body.deviceId,
                req.body.sensorType,
                req.body.unit,
                req.body.thresholdMin || defaults.threshold_min || 0,
                req.body.thresholdMax || defaults.threshold_max || 0
            );
            return res.status(201).json(sensor);
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @param {import("express").Request} req - Express request
     * @param {import("express").Response} res - Express response
     * @param {import("express").NextFunction} next - Next function
     */
    async update(req, res, next) {
        const schema = {
            type: "object",
            properties: {
                id: { type: "string" },
                sensorType: { type: "string" },
                unit: { type: "string" },
                thresholdMin: { type: "number" },
                thresholdMax: { type: "number" }
            },
            required: ["id"],
            additionalProperties: false
        };
        try {
            const params = { ...req.body, ...req.params};
            const validationResult = this.validate(schema, params);
            if (!validationResult.success) {
                return next(validationResult.errorDetails);
            }

            const updatedSensor = await this.service.update(params.id, {
                sensorType: params.sensorType,
                unit: params.unit,
                thresholdMin: params.thresholdMin,
                thresholdMax: params.thresholdMax
            });

            if (!updatedSensor) {
                return next(this.notFoundError());
            }

            return res.status(200).json(updatedSensor);
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @param {import("express").Request} req - Express request
     * @param {import("express").Response} res - Express response
     * @param {import("express").NextFunction} next - Next function
     */
    async delete(req, res, next) {
        const schema = {
            type: "object",
            properties: {
                id: { type: "string" }
            },
            required: ["id"],
            additionalProperties: false
        };
        try {
            const validationResult = this.validate(schema, req.params);
            if (!validationResult.success) {
                return next(validationResult.errorDetails);
            }

            const sensor = await this.service.get(req.params.id);

            if (!sensor) {
                return next(this.notFoundError());
            }

            await this.service.delete(req.params.id);

            return res.sendStatus(204);
        } catch (error) {
            return next(error);
        }
    }
}

export default SensorController;