package com.ims.smartinventory.exception;

import com.ims.smartinventory.dto.Response.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NoSuitableSectionException.class)
    public ResponseEntity<ErrorResponse> handleNoSuitableSectionException(NoSuitableSectionException e) {
        ErrorResponse errorResponse = new ErrorResponse(e.getMessage(), "NO_SUITABLE_SECTION");
        return new ResponseEntity<>(errorResponse, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @ExceptionHandler(StorageException.class)
    public ResponseEntity<ErrorResponse> handleStorageException(StorageException e) {
        ErrorResponse errorResponse = new ErrorResponse(e.getMessage(), "STORAGE_ERROR");
        return new ResponseEntity<>(errorResponse, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException e) {
        ErrorResponse errorResponse = new ErrorResponse(e.getMessage(), "OPERATION_FAILED");
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception e) {
        // Log the actual exception details for debugging
        System.err.println("=== GLOBAL EXCEPTION HANDLER ===");
        System.err.println("Exception Type: " + e.getClass().getSimpleName());
        System.err.println("Exception Message: " + e.getMessage());
        System.err.println("Stack Trace:");
        e.printStackTrace();
        System.err.println("=== END EXCEPTION DETAILS ===");

        ErrorResponse errorResponse = new ErrorResponse("An unexpected error occurred. Please contact administrator.", "INTERNAL_SERVER_ERROR");
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
