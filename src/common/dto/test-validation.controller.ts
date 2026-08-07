import { Body, Controller, Post } from "@nestjs/common";
import { TestValidationDto } from "./test-validation.dto";

@Controller('test-validation')
export class TestValidationController {
    @Post()
    testValidation(@Body() body: TestValidationDto) {
        return {
            message: 'Validation successful',
            data: body,
        }
    }
}