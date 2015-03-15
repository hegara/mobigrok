package org.hermes.util;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.hermes.configuration.Env;
import org.opensolaris.opengrok.util.Executor;

public class Indexer {
	private static final Logger log = Logger.getLogger(Indexer.class
			.getSimpleName());

	private String _url;
	private File _targetRoot;
	private File _sourceCodeDir;
	private File _indexDataDir;
	private File _configFile;

	public Indexer(String url, String targetPath) {
		_url = url;
		_targetRoot = new File(targetPath);
		_sourceCodeDir = new File(_targetRoot, "src");
		_indexDataDir = new File(_targetRoot, "data");
		_configFile = new File(_targetRoot, "configuration.xml");
	}

	private static void execHelper(String[] cmdlist) {
		Executor executor = new Executor(cmdlist);

		int ret = executor.exec(false);
		String output = executor.getOutputString();
		if (output.length() == 0) {
			output = executor.getErrorString();
		}
		Level logLevel = Level.INFO;
		if (ret != 0) {
			logLevel = Level.WARNING;
		}
		log.log(logLevel, "{0}...", output);
		return;
	}

	private static void delete(File f) throws IOException {
		if (f.isDirectory()) {
			for (File c : f.listFiles())
				delete(c);
		}
		if (!f.delete())
			throw new FileNotFoundException("Failed to delete file: " + f);
	}

	public void prepare() {
		if (_targetRoot.exists()) {
			try {
				delete(_targetRoot);
			} catch (Throwable e) {
				log.log(Level.SEVERE,
						"Target folder cannot be accessed while preparing: {0}\n{1}",
						new String[] { _targetRoot.getPath(), e.getMessage() });
				throw new RuntimeException(e);
			}
		}
		_targetRoot.mkdirs();
		log.log(Level.INFO, "Directory prepared");
	}

	public void gitClone() {
		execHelper(new String[] { Env.getGit(), "clone", "--progress",
				"--recursive", "--depth", "1", _url, _sourceCodeDir.getPath() });
		log.log(Level.INFO, "Source code downloaded via git");
	}

	public void opengrokIndex() {
		execHelper(new String[] { Env.getJava(), "-jar", Env.getOpengrok(),
				"-c", Env.getCtags(), "-d", _indexDataDir.getPath(), "-s",
				_sourceCodeDir.getPath(), "-W", _configFile.getPath(), "-v" });
		log.log(Level.INFO, "Index done via OpenGrok");
	}

	public static void main(String[] args) {
		log.setLevel(Level.ALL);
		if (Env.validateExuberantCtags() && Env.validateOpenGrok()
				&& Env.validateGit()) {
			Indexer indexer = new Indexer(args[0], args[1]);
			indexer.prepare();
			indexer.gitClone();
			indexer.opengrokIndex();
			System.out.println("Done!");
		}
	}

}
