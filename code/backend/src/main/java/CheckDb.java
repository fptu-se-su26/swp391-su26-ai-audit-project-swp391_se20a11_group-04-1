import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckDb {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://localhost:5432/dev_track_ai?user=root&password=root";
        try (Connection conn = DriverManager.getConnection(url);
             Statement stmt = conn.createStatement()) {
            ResultSet rs = stmt.executeQuery("SELECT column_name, column_default, is_nullable, is_identity FROM information_schema.columns WHERE table_name = 'test_runs' AND column_name = 'id'");
            if (rs.next()) {
                System.out.println("column_name: " + rs.getString("column_name"));
                System.out.println("column_default: " + rs.getString("column_default"));
                System.out.println("is_nullable: " + rs.getString("is_nullable"));
                System.out.println("is_identity: " + rs.getString("is_identity"));
            } else {
                System.out.println("No 'id' column found in 'test_runs'");
            }
        }
    }
}
