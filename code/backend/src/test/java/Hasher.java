import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
public class Hasher {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println(encoder.encode("30042005"));
    }
}
