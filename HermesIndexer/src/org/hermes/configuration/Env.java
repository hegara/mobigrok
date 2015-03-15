package org.hermes.configuration;

import java.util.logging.Level;
import java.util.logging.Logger;

import org.opensolaris.opengrok.util.Executor;

public class Env {
	private static final Logger log = Logger.getLogger(Env.class
			.getSimpleName());

	public static String getCtags() {
		return "C:\\tools\\ctags58\\ctags.exe";
	}

	public static String getOpengrok() {
		return ".\\opengrok.jar";
	}

	public static String getJava() {
		return "java";
	}

	public static String getGit() {
		return "git";
	}

	private static boolean validateCommandHelper(Executor executor,
			String keyword, String triedPath) {
		boolean ret = true;

		executor.exec(false);
		String output = executor.getOutputString();
		if (output == null || output.indexOf(keyword) == -1) {
			log.log(Level.SEVERE, "Error: No {0} found in PATH!\n"
					+ "(tried running " + "{1}" + ")", new String[] { keyword,
					triedPath });
			ret = false;
		}

		return ret;
	}

	public static boolean validateGit() {
		return validateCommandHelper(new Executor(new String[] { getGit(),
				"--version" }), "git", getGit());
	}

	public static boolean validateOpenGrok() {
		return validateCommandHelper(new Executor(new String[] { getJava(),
				"-jar", getOpengrok(), "-V" }), "OpenGrok", getJava());
	}

	public static boolean validateExuberantCtags() {
		return validateCommandHelper(new Executor(new String[] { getCtags(),
				"--version" }), "Exuberant Ctags", getCtags());
	}
}
