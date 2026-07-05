import DiagnosisService from "../services/diagnosis.service.js";
import ApiError from "../api-error.js";

class DiagnosisController {
    constructor() {
        this.diagnosisService = new DiagnosisService();
    }

    create = async (req, res, next) => {
        try {
            if (!req.body.image_url) {
                return next(new ApiError(400, "Image URL is required"));
            }

            const diagnosis = await this.diagnosisService.create({
                user_id: req.body.user_id,
                image_url: req.body.image_url,
                notes: req.body.notes
            });

            return res.status(201).json(diagnosis);
        } catch (error) {
            return next(new ApiError(500, "An error occurred while creating the diagnosis"));
        }
    }

    getHistory = async (req, res, next) => {
        try {
            const history = await this.diagnosisService.getHistory(req.params.userId);
            return res.json(history);
        } catch (error) {
            return next(new ApiError(500, "An error occurred while retrieving diagnosis history"));
        }
    }

    getLatest = async (req, res, next) => {
        try {
            const latest = await this.diagnosisService.getLatest(req.params.userId);
            return res.json(latest);
        } catch (error) {
            return next(new ApiError(500, "An error occurred while retrieving the latest diagnosis"));
        }
    }
}

export default new DiagnosisController();
