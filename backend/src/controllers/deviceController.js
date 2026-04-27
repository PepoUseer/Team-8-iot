import ControllerBase from "./controllerBase.js";
import deviceService from "../services/deviceService.js";


class DeviceController extends ControllerBase {
    service = deviceService;
    entityName = "Device";
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

            const device = await this.service.get(req.params.id);
            if (!device) {
                return next(this.notFoundError());
            }

            return res.status(200).json(device);
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @param {import("express").Request} req - Express request
     * @param {import("express").Response} res - Express response
     * @param {import("express").NextFunction} next - Next function
     */
    async getSensors(req, res, next) {
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

            const sensors = await this.service.getSensors(req.params.id);
            return res.status(200).json(sensors);
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
                sensors: { 
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            sensorType: { type: "string" },
                            unit: { type: "string" }
                        },
                    },
                }
            },
            required: ["sensors"],
            additionalProperties: false
        };
        try {
            const validationResult = this.validate(schema, req.body);
            if (!validationResult.success) {
                return next(validationResult.errorDetails);
            }

            const device = await this.service.create(req.body.sensors);
            return res.status(201).json(device);
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
                deviceName: { type: "string" }
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

            const updatedDevice = await this.service.update(params.id, params.deviceName);

            if (!updatedDevice) {
                return next(this.notFoundError());
            }

            return res.status(200).json(updatedDevice);
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

            const device = await this.service.get(req.params.id);

            if (!device) {
                return next(this.notFoundError());
            }

            await this.service.delete(req.params.id);

            return res.sendStatus(204);
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Create or get device by alias
     * @param {import("express").Request} req - Express request
     * @param {import("express").Response} res - Express response
     * @param {import("express").NextFunction} next - Next function
     */
    async createOrGet(req, res, next) {
        const schema = {
            type: "object",
            properties: {
                deviceAlias: { type: "string" },
                sensors: { 
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            sensorType: { type: "string" },
                            unit: { type: "string" }
                        },
                    },
                }
            },
            required: ["deviceAlias"],
            additionalProperties: false
        };
        try {
            const validationResult = this.validate(schema, req.body);
            if (!validationResult.success) {
                return next(validationResult.errorDetails);
            }

            const alias = await this.service.getAliasByName(req.body.deviceAlias);
            if (!alias) {
                return next({
                    message: "Invalid device alias",
                    details: `Device alias "${req.body.deviceAlias}" does not exist in the database`,
                    status: 400,
                })
            }

            const result = await this.service.createOrGet(req.body.deviceAlias, req.body.sensors);
            if (result.created) {
                return res.status(201).json(result.device);
            }
            return res.status(200).json(result.device);
        } catch (error) {
            return next(error);
        }
    }
}

export default DeviceController;