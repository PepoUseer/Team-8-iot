import ControllerBase from "./controllerBase.js";
import authService from "../services/authService.js";
import bcrypt from "bcrypt";

class AuthController extends ControllerBase {
    entityName = "User";
    service = authService;

    /**
     * @param {import("express").Request} req - Express request
     * @param {import("express").Response} res - Express response
     * @param {import("express").NextFunction} next - Next function
     */
    async register(req, res, next) {
        const schema = {
            type: "object",
            properties: {
                username: { type: "string", minLength: 2, maxLength: 50 },
                email: { type: "string", maxLength: 100 },
                password: { type: "string", minLength: 6 },
            },
            required: ["username", "email", "password"],
            additionalProperties: false,
        };

        try {
            const validationResult = this.validate(schema, req.body);
            if (!validationResult.success) {
                return next(validationResult.errorDetails);
            }

            const userByEmail = await this.service.getUserByEmail(req.body.email);
            if (userByEmail) {
                return next({
                    message: "Email already registered",
                    status: 401,
                });
            }

            const userByUsername = await this.service.getUserByUsername(req.body.username);
            if (userByUsername) {
                return next({
                    message: "Username already taken",
                    status: 401,
                });
            }

            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(req.body.password, saltRounds);

            const user = await this.service.createUser(req.body.username, req.body.email, passwordHash);

            req.session.userId = user.user_id;
            req.session.username = user.username;
            req.session.email = user.email;

            return res.status(201).json({
                message: "New user registered",
                user: {
                    id: user.user_id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (error) {
            return next(error);
        }

    }


    /**
     * @param {import("express").Request} req - Express request
     * @param {import("express").Response} res - Express response
     * @param {import("express").NextFunction} next - Next function
     */
    async login(req, res, next) {
        const schema = {
            type: "object",
            properties: {
                email: { type: "string", maxLength: 100 },
                password: { type: "string" },
            },
            required: ["email", "password"],
            additionalProperties: false,
        };

        try {
            const validationResult = this.validate(schema, req.body);
            if (!validationResult.success) {
                return next(validationResult.errorDetails);
            }

            const user = await this.service.getUserByEmail(req.body.email);
            if (!user) {
                return next({
                    message: "Invalid email or password",
                    status: 401,
                });
            }

            const passwordMatch = await bcrypt.compare(req.body.password, user.password_hash);
            if (!passwordMatch) {
                return next({
                    message: "Invalid email or password",
                    status: 401,
                });
            }

            req.session.userId = user.user_id;
            req.session.username = user.username;
            req.session.email = user.email;

            return res.status(200).json({
                message: "User logged in",
                user: {
                    id: user.user_id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (error) {
            return next(error);
        }
    }
}

export default AuthController;