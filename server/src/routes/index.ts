import { Router, type IRouter } from "express";
import healthRouter from "./health";
import capacityRouter from "./capacity";
import authRouter from "./auth";
import adminRouter from "./admin";
import traineeRouter from "./trainee";
import trainerRouter from "./trainer";
import { authenticate } from "../middleware/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authenticate);
router.use(authRouter);
router.use(adminRouter);
router.use(trainerRouter);
router.use(traineeRouter);
router.use(capacityRouter);

export default router;
