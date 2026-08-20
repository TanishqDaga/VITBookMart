package com.vitbookmart.exception;

public class TerminatedUserException extends RuntimeException {

    public TerminatedUserException(String message) {
        super(message);
    }
}