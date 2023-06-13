package validation;

public interface Validator<T> {

    boolean isValid(T object);
}
