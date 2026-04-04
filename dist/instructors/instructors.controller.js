"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstructorsController = void 0;
const common_1 = require("@nestjs/common");
const instructors_service_1 = require("./instructors.service");
const dto_1 = require("./dto");
const guards_1 = require("../common/guards");
const decorators_1 = require("../common/decorators");
const client_1 = require("@prisma/client");
let InstructorsController = class InstructorsController {
    instructorsService;
    constructor(instructorsService) {
        this.instructorsService = instructorsService;
    }
    search(dto) {
        return this.instructorsService.search(dto);
    }
    getMyProfile(user) {
        return this.instructorsService.getMyProfile(user.id);
    }
    createProfile(user, dto) {
        return this.instructorsService.createProfile(user.id, dto);
    }
    updateProfile(user, dto) {
        return this.instructorsService.updateProfile(user.id, dto);
    }
    setLocation(user, dto) {
        return this.instructorsService.setLocation(user.id, dto);
    }
    submitApplication(user) {
        return this.instructorsService.submitApplication(user.id);
    }
    updateStatus(id, status) {
        return this.instructorsService.updateStatus(id, status);
    }
    getPublicProfile(id) {
        return this.instructorsService.getPublicProfile(id);
    }
    getAvailability(id, date) {
        return this.instructorsService.getAvailability(id, date);
    }
};
exports.InstructorsController = InstructorsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.SearchInstructorsDto]),
    __metadata("design:returntype", void 0)
], InstructorsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('me/profile'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.UserRole.INSTRUCTOR),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InstructorsController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Post)('me'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.UserRole.INSTRUCTOR),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateInstructorProfileDto]),
    __metadata("design:returntype", void 0)
], InstructorsController.prototype, "createProfile", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.UserRole.INSTRUCTOR),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.UpdateInstructorProfileDto]),
    __metadata("design:returntype", void 0)
], InstructorsController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Put)('me/location'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.UserRole.INSTRUCTOR),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.SetLocationDto]),
    __metadata("design:returntype", void 0)
], InstructorsController.prototype, "setLocation", null);
__decorate([
    (0, common_1.Post)('me/submit'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.UserRole.INSTRUCTOR),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InstructorsController.prototype, "submitApplication", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InstructorsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InstructorsController.prototype, "getPublicProfile", null);
__decorate([
    (0, common_1.Get)(':id/availability'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InstructorsController.prototype, "getAvailability", null);
exports.InstructorsController = InstructorsController = __decorate([
    (0, common_1.Controller)('instructors'),
    __metadata("design:paramtypes", [instructors_service_1.InstructorsService])
], InstructorsController);
//# sourceMappingURL=instructors.controller.js.map